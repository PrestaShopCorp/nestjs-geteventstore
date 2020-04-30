import { EventStoreCatchupSubscriptionConfig, EventStorePersistentSubscriptionConfig } from './SubscriptionTypes';
import { IEvent } from '@nestjs/cqrs';
import { TAcknowledgeEventStoreEvent, TEventStoreEvent } from './EventTypes';
import { EventStoreProjection } from './EventStoreProjection';

export type EventStoreBusConfig = {
  projections?: EventStoreProjection[],
  subscriptions?: {
    catchup?: EventStoreCatchupSubscriptionConfig[],
    //volatile? : EventStoreVolatileSubscription[],
    persistent?: EventStorePersistentSubscriptionConfig[]
  };
  eventMapper?: (event: TEventStoreEvent | TAcknowledgeEventStoreEvent) => IEvent;
};
export type AllEvents = {
  IEvent
}
export const defaultMapper = (allEvents: AllEvents) => {
  return (event: TEventStoreEvent) => {
    let className = `${event.eventType}Event`;
    if (allEvents[className]) {
      return new allEvents[className](event);
    }
    return false;
  }
};