import { IPersistentSubscriptionConfig } from '../../../interfaces';
import { PersistentSubscriptionOptions } from '../../connector/interface/persistent-subscriptions-options';
import { Credentials } from '@eventstore/db-client/dist/types';

export interface IPersistentSubscriptionsService {
  subscribeToPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[],
  ): Promise<any>;

  createPersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions?: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void>;

  updatePersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void>;

  deletePersistentSubscription(
    streamName: string,
    group: string,
  ): Promise<void>;
}
