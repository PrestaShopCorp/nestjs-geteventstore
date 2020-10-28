import { PersistentSubscriptionOptions } from 'geteventstore-promise';
import {
  EventStoreCatchUpSubscription,
  EventStorePersistentSubscription,
  EventStoreSubscription,
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
      | EventStoreCatchUpSubscription
      | EventStoreSubscription;
  };
}

export type IEventStorePersistentSubscriptionConfig = {
  stream: string;
  group: string;
  options?: PersistentSubscriptionOptions;
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
};

export type EventStoreVolatileSubscriptionConfig = {
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
};
