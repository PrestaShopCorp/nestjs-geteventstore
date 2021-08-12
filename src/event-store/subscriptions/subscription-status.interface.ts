import EventStorePersistentSubscription from './event-store-persistent-subscribtion';
import EventStoreCatchUpSubscription from './event-store-catchup-subscription';
import EventStoreSubscription from './event-store-subscription';

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
