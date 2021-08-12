import EventStoreCatchUpSubscription from './event-store-catchup-subscription';

export interface ICatchupSubscriptionConfig {
  stream: string;
  lastCheckpoint?: number;
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
