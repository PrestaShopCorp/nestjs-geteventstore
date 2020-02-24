import { EventStoreCatchUpSubscription, EventStorePersistentSubscription } from 'node-eventstore-client';

export interface ExtendedCatchUpSubscription extends EventStoreCatchUpSubscription {
  isLive: boolean | undefined;
}

export interface ExtendedPersistentSubscription
  extends EventStorePersistentSubscription {
  isLive: boolean | undefined;
}