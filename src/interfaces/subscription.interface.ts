import {
  EventStoreCatchUpSubscription,
  EventStorePersistentSubscription,
} from 'node-eventstore-client';

export enum NamedConsumerStrategy {
  RoundRobin = 'RoundRobin',
  DispatchToSingle = 'DispatchToSingle',
  Pinned = 'Pinned',
}

export interface ISubscriptionStatus {
  [key: string]: {
    isConnected: boolean;
    status: string;
    streamName: string;
    group?: string;
    subscription?:
      | EventStorePersistentSubscription
      | EventStoreCatchUpSubscription;
  };
}

export type IEventStorePersistentSubscriptionConfig = {
  stream: string;
  group: string;
  options?: {
    resolveLinktos?: boolean;
    startFrom?: number;
    extraStatistics?: boolean;
    messageTimeout?: number;
    maxRetryCount?: number;
    liveBufferSize?: number;
    readBatchSize?: number;
    historyBufferSize?: number;
    checkPointAfter?: number;
    minCheckPointCount?: number;
    maxCheckPointCount?: number;
    maxSubscriberCount?: number;
    namedConsumerStrategy?: NamedConsumerStrategy;
  };
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
