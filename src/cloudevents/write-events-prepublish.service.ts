import { Logger, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import {
  Context,
  CONTEXT_BIN,
  CONTEXT_CORRELATION_ID,
  CONTEXT_HOSTNAME,
  CONTEXT_PATH,
} from 'nestjs-context';
import {
  IBaseEvent,
  IEventBusPrepublishPrepareProvider,
  IEventBusPrepublishValidateProvider,
} from '../interfaces';
import { EventStoreEvent } from '../events';
import { EventMetadataDto } from '../dto';
import { createEventDefaultMetadata } from '../tools/create-event-default-metadata';
import { isIPv4 } from 'net';

@Injectable()
export class WriteEventsPrepublishService<
  T extends IBaseEvent = EventStoreEvent
> implements
    IEventBusPrepublishValidateProvider<T>,
    IEventBusPrepublishPrepareProvider<T> {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly context: Context) {}
  // errors log
  async onValidationFail(events: T[], errors: ValidationError[]) {
    const errorDetails = this.flattenDetails(errors);
    this.logger.error(
      `Validation found ${errors.length} errors: ${JSON.stringify(
        errorDetails,
      )}`,
    );
  }

  private getErrorDetails(error: ValidationError, parent = null) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const details = [];
    if (error.constraints) {
      for (const [issue, description] of Object.entries(error.constraints)) {
        const errorDetail = {
          event: error.target.constructor.name,
          field,
          value: error.value,
          issue,
          description,
        };
        details.push(errorDetail);
      }
    } else {
      // we should never arrive here
      details.push({
        field,
        value: error.value,
        issue: 'unknown',
        description: '',
      });
    }
    return details;
  }

  private flattenDetails(validationErrors: ValidationError[], parent = null) {
    return validationErrors
      .map((validationError) => {
        if (validationError.children.length) {
          return this.flattenDetails(
            validationError.children,
            parent
              ? `${parent}.${validationError.property}`
              : validationError.property,
          );
        } else {
          return this.getErrorDetails(validationError, parent);
        }
      })
      .flat();
  }

  // transform to dto each event and validate it
  async validate(events: T[]) {
    let errors = [];
    for (const event of events) {
      this.logger.debug(`Validating ${event.constructor.name}`);
      const validateEvent: any = plainToClass(event.constructor as any, event);
      errors = [...errors, ...(await validate(validateEvent))];
    }
    return errors;
  }

  private getCloudEventMetadata(event: T): EventMetadataDto {
    try {
      const { version: defaultVersion, time } = createEventDefaultMetadata();
      const version = event?.metadata?.version ?? defaultVersion;
      const hostnameRaw = this.context.get(CONTEXT_HOSTNAME);
      const hostname = isIPv4(hostnameRaw)
        ? `${hostnameRaw.split(/[.]/).join('-')}.ip`
        : hostnameRaw;
      const hostnameArr = hostname.split('.');
      const eventType = `${hostnameArr[1] ? hostnameArr[1] + '.' : ''}${
        hostnameArr[0]
      }.${this.context.get(CONTEXT_BIN)}.${event.eventType}.${version}`;
      const source = `${hostname}${this.context.get(CONTEXT_PATH)}`;
      return {
        specversion: 1,
        time,
        version,
        correlation_id: this.context.get(CONTEXT_CORRELATION_ID),
        type: eventType,
        source,
      };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  // add cloud events metadata
  async prepare(events: T[]) {
    const preparedEvents = [];
    for (const event of events) {
      this.logger.debug(`Preparing ${event.constructor.name}`);
      const preparedEvent = event;
      preparedEvent.metadata = {
        ...this.getCloudEventMetadata(event),
        ...(event.metadata ?? {}),
      };
      preparedEvents.push(preparedEvent);
    }
    return preparedEvents;
  }
}
