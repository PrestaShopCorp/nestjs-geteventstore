import { EventStoreCatchupSubscriptionConfig, EventStorePersistentSubscriptionConfig } from './SubscriptionTypes';
import { IEvent } from '@nestjs/cqrs';
import { TAcknowledgeEventStoreEvent, TEventStoreEvent } from './EventTypes';
import { EventStoreProjection } from './EventStoreProjection';

export type EventStoreBusConfig = {
  projections?: EventStoreProjection[],
  subscriptions: {
    catchup?: EventStoreCatchupSubscriptionConfig[],
    //volatile? : EventStoreVolatileSubscription[],
    persistent?: EventStorePersistentSubscriptionConfig[]
  };
  eventMapper: (event: TEventStoreEvent | TAcknowledgeEventStoreEvent) => IEvent;
};