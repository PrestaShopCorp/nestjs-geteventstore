import { Logger, Injectable, Inject } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
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
  IWriteEventBusConfig,
} from '../interfaces';
import { EventStoreEvent } from '../events';
import { EventMetadataDto } from '../dto';
import { createEventDefaultMetadata } from '../tools/create-event-default-metadata';
import { WRITE_EVENT_BUS_CONFIG } from '../constants';

@Injectable()
export class WriteEventsPrepublishService<
  T extends IBaseEvent = EventStoreEvent
> implements
    IEventBusPrepublishValidateProvider<T>,
    IEventBusPrepublishPrepareProvider<T> {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly context: Context,
    @Inject(WRITE_EVENT_BUS_CONFIG)
    private readonly config: IWriteEventBusConfig,
  ) {}
  // errors log
  async onValidationFail(events: T[], errors: any[]) {
    for (const error of errors) {
      this.logger.error(error);
    }
  }

  // transform to dto each event and validate it
  async validate(events: T[]) {
    let errors = [];
    for (const event of events) {
      this.logger.debug(`Validating ${event.constructor.name}`);
      // @todo JDM class-transformer is not converting data property !
      //    (metadata is working, so it might be related to inheritance)
      const validateEvent: any = plainToClass(event.constructor as any, event);
      errors = [...errors, ...(await validate(validateEvent))];
    }
    return errors;
  }

  private getCloudEventMetadata(event: T): EventMetadataDto {
    try {
      const { version: defaultVersion, time } = createEventDefaultMetadata();
      const version = event?.metadata?.version ?? defaultVersion;
      const hostname = this.context.get(CONTEXT_HOSTNAME);
      const hostnameArr = hostname.split('.');
      const eventType = `${hostnameArr[1] ? hostnameArr[1] + '.' : ''}${
        hostnameArr[0]
      }.${this.config.serviceName ?? this.context.get(CONTEXT_BIN)}.${
        event.eventType
      }.${version}`;
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
        ...(event.metadata ?? {}),
        ...this.getCloudEventMetadata(event),
      };
      preparedEvents.push(preparedEvent);
    }
    return preparedEvents;
  }
}
