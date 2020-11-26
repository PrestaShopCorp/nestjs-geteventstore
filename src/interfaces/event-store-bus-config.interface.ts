import {
  EventStoreCatchupSubscriptionConfig,
  EventStoreVolatileSubscriptionConfig,
  IEventStorePersistentSubscriptionConfig,
} from './subscription.interface';
import { IEvent } from '@nestjs/cqrs';
import { IEventStoreEventOptions } from './event.interface';
import { IEventStoreProjection } from './projection.interface';
import { Logger } from '@nestjs/common';
import { EventStoreBus } from '..';

export interface IEventStoreBusConfig {
  projections?: IEventStoreProjection[];
  subscriptions?: {
    catchup?: EventStoreCatchupSubscriptionConfig[];
    volatile?: EventStoreVolatileSubscriptionConfig[];
    persistent?: IEventStorePersistentSubscriptionConfig[];
  };
  //
  eventMapper?: (data: any, options: IEventStoreEventOptions) => IEvent | false;
  // Handle publish error default do nothing
  onPublishFail?: (
    error: Error,
    events: IEvent[],
    eventStore: EventStoreBus,
  ) => void;
  // After saving to event store, forward to local event handler(s) and saga(s)
  // useful when using micro services for event handling and saga
  publishAlsoLocally?: boolean;
}

// TODO fine the proper syntax for allEvents param
export const defaultEventMapper = (allEvents: any) => {
  const logger = new Logger('Default Event Mapper');
  logger.log(`Will build events from ${allEvents}`);
  return (data, options: IEventStoreEventOptions) => {
    let className = `${options.eventType}Event`;
    if (allEvents[className]) {
      logger.log(
        `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId} and number ${options.eventNumber}`,
      );
      return new allEvents[className](data, options);
    }
    return false;
  };
};
