import { EventStoreCatchupSubscriptionConfig, IEventStorePersistentSubscriptionConfig } from './subscription.interface';
import { IEvent } from '@nestjs/cqrs';
import { IEventStoreEventOptions } from './event.interface';
import { IEventStoreProjection } from './projection.interface';
import { Logger } from '@nestjs/common';

export interface IEventStoreBusConfig {
  projections?: IEventStoreProjection[],
  subscriptions?: {
    catchup?: EventStoreCatchupSubscriptionConfig[],
    //volatile? : EventStoreVolatileSubscription[],
    persistent?: IEventStorePersistentSubscriptionConfig[]
  };
  eventMapper?: (data: any, options: IEventStoreEventOptions) => IEvent | false;
  writeBuffer?: {
    enabled: boolean,
    writeTimeout: number,
    retryInterval: number,
  }
};
export type AllEvents = {
  IEvent
}
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