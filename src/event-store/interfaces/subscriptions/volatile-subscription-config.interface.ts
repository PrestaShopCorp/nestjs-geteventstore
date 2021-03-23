import { EventStoreCatchUpSubscription } from 'node-eventstore-client';

export interface IVolatileSubscriptionConfig {
  stream: string;
  resolveLinkTos?: boolean;
  onSubscriptionStart?: (
    sub: EventStoreCatchUpSubscription,
  ) => void | undefined;
  onSubscriptionDropped?: (
    sub: EventStoreCatchUpSubscription,
    reason: string,
    error: string,
  ) => void | undefined;
}
