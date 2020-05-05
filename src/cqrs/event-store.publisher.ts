import { Injectable } from '@nestjs/common';
import { IEvent,AggregateRoot,EventBus } from '@nestjs/cqrs';
import { EventStore } from '../event-store.class';
import { StreamConfig } from '../interfaces/aggregate-root.interface';
import { tap } from 'rxjs/operators';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
// @ts-ignore
export class EventStorePublisher {
  constructor(private readonly eventBus: EventBus, private readonly eventStore: EventStore) {}

  async commitToStream(aggregateRoot: AggregateRoot, streamConfig: StreamConfig) {
    console.log('Commit to stream ', streamConfig);
    const events = aggregateRoot.getUncommittedEvents();
    return this.eventStore.writeEvents(streamConfig.streamName, events, streamConfig.expectedVersion)
      .pipe(tap(aggregateRoot.uncommit))
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