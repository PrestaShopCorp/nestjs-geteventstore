import { pick } from 'lodash';
import { empty, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IEventPublisher, IMessageSource } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { IStreamConfig } from './interfaces';
import { ExpectedVersion } from './enum';
import { EventStore } from './event-store';
import { IReadEvent, IWriteEvent, IWriteEventBusConfig } from '../interfaces';

export class EventStorePublisher<EventBase extends IWriteEvent = IWriteEvent>
  implements IEventPublisher<EventBase>, IMessageSource<EventBase> {
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

  private getStreamName(
    correlationId: EventBase['metadata']['correlation_id'],
  ) {
    return `${this.config.serviceName}-${correlationId}`;
  }

  async publish<T extends EventBase>(
    event: T,
    expectedVersion = ExpectedVersion.Any,
  ) {
    const streamName = this.getStreamName(event.metadata.correlation_id);
    this.logger.debug(
      `Commit 1 event to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return await this.writeEvents([event], streamName, expectedVersion);
  }

  async publishAll<T extends EventBase>(
    events: T[],
    expectedVersion = ExpectedVersion.Any,
    correlationId?: EventBase['metadata']['correlation_id'],
  ) {
    const eventCount = events.length;
    const streamName = this.getStreamName(
      correlationId || events[0].metadata.correlation_id,
    );
    this.logger.debug(
      `Commit ${eventCount} events to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return await this.writeEvents(events, streamName, expectedVersion);
  }

  bridgeEventsTo<T extends EventBase | IReadEvent>(subject$: Subject<T>) {
    subject$.subscribe((ev) => {
      const pickFromEv = pick(ev as T, ['data', 'metadata', 'eventId']);
      return this.writeEvents(
        [pickFromEv],
        this.getStreamName(pickFromEv.metadata.correlation_id),
      );
    });
  }
}
