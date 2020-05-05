import { Injectable, Logger } from '@nestjs/common';
import { AggregateRoot, EventBus, IEvent } from '@nestjs/cqrs';
import { EventStore } from '../event-store.class';
import { ExpectedVersion, IStreamConfig } from '..';
import { catchError, tap } from 'rxjs/operators';
import { empty } from 'rxjs';

export interface Constructor<T> {
  new(...args: any[]): T;
}

@Injectable()
// @ts-ignore
export class EventStorePublisher {
  constructor(private readonly eventBus: EventBus, private readonly eventStore: EventStore) {
  }

  async commitToStream(aggregateRoot: AggregateRoot, streamConfig: IStreamConfig) {
    console.log('Commit to stream ', streamConfig);
    const events = aggregateRoot.getUncommittedEvents();
    return this.eventStore.writeEvents(streamConfig.streamName, events, streamConfig.expectedVersion)
      .pipe(
        tap(() => aggregateRoot.uncommit()),
        tap(() => {
          if (streamConfig.maxAge) {
            this.eventStore.connection.setStreamMetadataRaw(
              streamConfig.streamName,
              ExpectedVersion.Any,
              {
                '$maxAge': streamConfig.maxAge,
              },
            );
          }
        }),
      )
      .pipe(
        catchError(e => {
          Logger.warn(`Error committing ${events.length} events to stream ${streamConfig.streamName} : ${e.message} ${e.response.statusText}`);
          return empty();
        }),
      )
      .toPromise();

  }

  mergeClassContext<T extends Constructor<AggregateRoot>>(metatype: T): T {
    const eventBus = this.eventBus;
    return class extends metatype {
      publish(event: IEvent) {
        eventBus.publish(event);
      }
    };
  }

  mergeObjectContext<T extends AggregateRoot>(object: T): T {
    const eventBus = this.eventBus;
    object.publish = (event: IEvent) => {
      eventBus.publish(event);
    };
    return object;
  }
}