import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils/persistentSubscriptionSettings';

export interface SubscriptionConfiguration {
  stream: string;
  group: string;

  options: PersistentSubscriptionSettings;

  // kept but might be useless
  onSubscriptionStart?: (sub: SubscriptionConfiguration) => void | undefined;

  // kept but might be useless
  onSubscriptionDropped?: (
    sub: SubscriptionConfiguration,
    reason: string,
    error: string,
  ) => void | undefined;
}
