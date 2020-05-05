import { EventStoreCatchUpSubscription, EventStorePersistentSubscription } from 'node-eventstore-client';

export enum namedConsumerStrategy {
  ROUND_ROBIN = 'RoundRobin',
  DISPATCH_TO_SINGLE = 'DispatchToSingle',
  PINNED = 'Pinned',
}
export type IEventStorePersistentSubscriptionConfig = {
  stream: string;
  group: string;
  options?: {
    resolveLinktos?: boolean,
    startFrom?: number,
    extraStatistics?: boolean,
    messageTimeout?: number,
    maxRetryCount?: number,
    liveBufferSize?: number,
    readBatchSize?: number,
    historyBufferSize?: number,
    checkPointAfter?: number,
    minCheckPointCount?: number,
    maxCheckPointCount?: number,
    maxSubscriberCount?: number,
    namedConsumerStrategy?: 'RoundRobin' | 'DispatchToSingle' | 'Pinned',
  },
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
};

export type EventStoreCatchupSubscriptionConfig = {
  stream: string;
  onSubscriptionStart?: (
    sub: EventStoreCatchUpSubscription,
  ) => void | undefined;
  onSubscriptionDropped?: (
    sub: EventStoreCatchUpSubscription,
    reason: string,
    error: string,
  ) => void | undefined;
};