import { EventStoreCatchupSubscriptionConfig, EventStorePersistentSubscriptionConfig } from './SubscriptionTypes';
import { IEvent } from '@nestjs/cqrs';
import { TAcknowledgeEventStoreEvent, TEventStoreEvent } from './EventTypes';

export type EventStoreBusConfig = {
  subscriptions: {
    catchup?: EventStoreCatchupSubscriptionConfig[],
    //volatile? : EventStoreVolatileSubscription[],
    persistent?: EventStorePersistentSubscriptionConfig[]
  };
  eventMapper: (event: TEventStoreEvent | TAcknowledgeEventStoreEvent) => IEvent;
};