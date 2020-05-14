import {
  EventStoreCatchupSubscriptionConfig,
  EventStoreVolatileSubscriptionConfig,
  IEventStorePersistentSubscriptionConfig,
} from './subscription.interface';
import { IEvent } from '@nestjs/cqrs';
import { IEventStoreEventOptions } from './event.interface';
import { IEventStoreProjection } from './projection.interface';
import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

export interface IEventStoreBusConfig {
  projections?: IEventStoreProjection[];
  subscriptions?: {
    catchup?: EventStoreCatchupSubscriptionConfig[];
    volatile?: EventStoreVolatileSubscriptionConfig[];
    persistent?: IEventStorePersistentSubscriptionConfig[];
  };
  eventMapper?: (data: any, options: IEventStoreEventOptions) => IEvent | false;
  // Handle publish error default do nothing
  onPublishFail?: (error: Error, event: IEvent) => Observable<any>;
  // After saving to event store, forward to local event handler(s) and saga(s)
  // useful when using micro services
  publishAlsoLocally?: boolean;
}
export type AllEvents = {
  IEvent;
};
export const defaultEventMapper = (allEvents: AllEvents) => {
  return (data, options: IEventStoreEventOptions) => {
    let className = `${options.eventType}Event`;
    if (allEvents[className]) {
      Logger.log(
        `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId}`,
      );
      return new allEvents[className](data, options);
    }
    return false;
  };
};
