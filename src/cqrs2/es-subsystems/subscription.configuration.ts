import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils/persistentSubscriptionSettings';

export interface SubscriptionConfiguration {
  stream: string;
  resolveLinkTos?: boolean;
  group: string;

  options: PersistentSubscriptionSettings;

  bufferSize?: number;

  onSubscriptionStart?: (sub: SubscriptionConfiguration) => void | undefined;

  onSubscriptionDropped?: (
    sub: SubscriptionConfiguration,
    reason: string,
    error: string,
  ) => void | undefined;
}
