import { PersistentSubscriptionOptions } from '../connector/interface/persistent-subscriptions-options';
import EventStorePersistentSubscription from './event-store-persistent-subscribtion';

export interface IPersistentSubscriptionConfig {
  stream: string;
  group: string;
  options?: PersistentSubscriptionOptions & /**
   * @deprecated The resolveLinktos parameter shouln't be used anymore. The resolveLinkTos parameter should be used instead.
   */ { resolveLinktos?: boolean };
  autoAck?: boolean | undefined;
  bufferSize?: number | undefined;
  onSubscriptionStart?: (
    sub: EventStorePersistentSubscription,
  ) => void | undefined;
  onSubscriptionDropped?: (
    sub: EventStorePersistentSubscription,
    reason: string,
    error: string,
  ) => void | undefined;
}
