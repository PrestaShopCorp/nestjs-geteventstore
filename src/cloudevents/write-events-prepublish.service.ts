import { Logger, Injectable, Inject } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
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
import { WriteEventDto } from '../dto/write-event.dto';
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
    for (const event of plainToClass(WriteEventDto, events)) {
      errors = [errors, ...(await validate(event))];
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
      preparedEvents.push({
        ...event,
        metadata: {
          ...(event.metadata ?? {}),
          ...this.getCloudEventMetadata(event),
        },
      });
    }
    return preparedEvents;
  }
}
