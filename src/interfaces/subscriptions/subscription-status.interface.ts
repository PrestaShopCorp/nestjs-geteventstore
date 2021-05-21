import {
  EventStoreCatchUpSubscription,
  EventStorePersistentSubscription,
  EventStoreSubscription,
} from 'node-eventstore-client';

export interface ISubscriptionStatus {
  [key: string]: {
    isConnected: boolean;
    status: string;
    streamName: string;
    group?: string;
    subscription?:
      | EventStorePersistentSubscription
      | EventStoreCatchUpSubscription
      | EventStoreSubscription;
  };
}
