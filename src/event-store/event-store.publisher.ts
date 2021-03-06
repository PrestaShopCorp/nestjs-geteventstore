import { hostname } from 'os';
import { empty, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IEventPublisher } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { basename, extname } from 'path';

import { ExpectedVersion } from '../enum';
import { EventStore } from './event-store';
import {
  IWriteEvent,
  IWriteEventBusConfig,
  PublicationContextInterface,
} from '../interfaces';

export class EventStorePublisher<EventBase extends IWriteEvent = IWriteEvent>
  implements IEventPublisher<EventBase> {
  private logger: Logger = new Logger(this.constructor.name);
  private readonly onPublishFail: IWriteEventBusConfig['onPublishFail'] = () =>
    empty();
  constructor(
    private readonly eventStore: EventStore,
    private readonly config: IWriteEventBusConfig,
  ) {
    if (config.onPublishFail) {
      this.onPublishFail = config.onPublishFail;
    }
  }

  private writeEvents<T extends EventBase>(
    events: T[],
    context: PublicationContextInterface = {
      streamName: this.getStreamName(events[0].metadata.correlation_id),
    },
  ) {
    const {
      streamName,
      expectedVersion = ExpectedVersion.Any,
      streamMetadata,
      expectedMetadataVersion = ExpectedVersion.Any,
    } = context;
    if (streamMetadata) {
      this.eventStore.writeMetadata(
        streamName,
        expectedMetadataVersion,
        streamMetadata,
      );
    }
    const eventCount = events.length;
    this.logger.debug(
      `Write ${eventCount} events to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return this.eventStore
      .writeEvents(streamName, events, expectedVersion)
      .pipe(
        catchError(
          (err) =>
            (this.onPublishFail && this.onPublishFail(err, events, this)) ||
            throwError(err),
        ),
      )
      .toPromise();
  }

  protected getStreamName(
    correlationId: EventBase['metadata']['correlation_id'],
  ) {
    const defaultName = process.argv?.[1]
      ? basename(process.argv?.[1], extname(process.argv?.[1]))
      : `${hostname()}_${process.argv?.[0] || 'unknown'}`;

    return `${this.config.serviceName || defaultName}-${correlationId}`;
  }

  async publish<T extends EventBase>(
    event: T,
    context?: PublicationContextInterface,
  ) {
    return await this.writeEvents([event], context);
  }

  async publishAll<T extends EventBase>(
    events: T[],
    context?: PublicationContextInterface,
  ) {
    return await this.writeEvents(events, context);
  }
}
