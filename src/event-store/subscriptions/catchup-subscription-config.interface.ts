import { EventStoreCatchUpSubscription } from 'node-eventstore-client';

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
