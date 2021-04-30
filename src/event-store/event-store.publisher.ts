import { hostname } from 'os';
import { empty, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IEventPublisher } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { basename, extname } from 'path';

import { IStreamConfig } from '../interfaces';
import { ExpectedVersion } from '../enum';
import { EventStore } from './event-store';
import { IWriteEvent, IWriteEventBusConfig } from '../interfaces';

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
    streamName: IStreamConfig['streamName'],
    expectedVersion: ExpectedVersion = ExpectedVersion.Any,
  ) {
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
    expectedVersion = ExpectedVersion.Any,
    customStreamName?: string,
  ) {
    const streamName =
      customStreamName || this.getStreamName(event.metadata.correlation_id);
    this.logger.debug(
      `Commit 1 event to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return await this.writeEvents([event], streamName, expectedVersion);
  }

  async publishAll<T extends EventBase>(
    events: T[],
    expectedVersion = ExpectedVersion.Any,
    customStreamName?: string,
  ) {
    const eventCount = events.length;
    const streamName =
      customStreamName || this.getStreamName(events[0].metadata.correlation_id);
    this.logger.debug(
      `Commit ${eventCount} events to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return await this.writeEvents(events, streamName, expectedVersion);
  }
}
