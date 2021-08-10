import {
  EventStoreProjection,
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  ISubscriptionStatus,
  IVolatileSubscriptionConfig,
  IWriteEvent,
} from '../../../interfaces';
import { Observable } from 'rxjs';
import {
  EventStoreCatchUpSubscription,
  EventStoreSubscription,
  WriteResult,
} from 'node-eventstore-client';
import { IEventStoreConfig } from '../../config';
import EventStorePersistentSubscription from '../../subscriptions/event-store-persistent-subscribtion';
import { ExpectedRevision } from '../../events';
import { PersistentSubscriptionOptions } from './persistent-subscriptions-options';
import { PersistentSubscriptionAssertResult } from './persistent-subscriptions-assert-result';
import { AppendResult } from './append-result';
import {
  Credentials,
  StreamSubscription,
} from '@eventstore/db-client/dist/types';

export const EVENT_STORE_CONNECTOR = Symbol();

export default interface EventStoreConnector {
  getConfig(): IEventStoreConfig;

  connect(): Promise<void> | void;

  isConnected(): boolean;

  disconnect(): void;

  getSubscriptions(): {
    persistent: ISubscriptionStatus;
    catchup: ISubscriptionStatus;
  };

  writeEvents(
    stream: string,
    events: IWriteEvent[],
    expectedVersion: ExpectedRevision,
  ): Promise<AppendResult>;

  writeMetadata(
    stream: string,
    expectedStreamMetadataVersion,
    streamMetadata: any,
  ): Observable<WriteResult | AppendResult>;

  readMetadata(stream: string): Observable<any>;

  readFromStream(stream: string, options: any);

  createPersistentSubscription(
    stream: string,
    group: string,
    settings: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void>;

  /**
   * Kept for retro compat, but useless as now with gRPC,
   * just a try on creation will succeed of raise error,
   * giving the same info
   */
  getPersistentSubscriptionInfo(
    subscription: IPersistentSubscriptionConfig,
  ): Promise<object | void>;

  subscribeToPersistentSubscription(
    stream: string,
    group: string,
    onEvent: (sub, payload) => void,
    autoAck: boolean,
    bufferSize: number,
    onSubscriptionStart: (sub) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ):
    | EventStorePersistentSubscription
    | Promise<EventStorePersistentSubscription>;

  subscribeToVolatileSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    resolveLinkTos: boolean,
    onSubscriptionStart: (subscription) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<EventStoreSubscription | StreamSubscription>;

  subscribeToCatchupSubscription(
    stream: string,
    onEvent: (
      subscription:
        | ICatchupSubscriptionConfig
        | IVolatileSubscriptionConfig
        | IPersistentSubscriptionConfig,
      payload: unknown,
    ) => void,
    lastCheckpoint: number,
    resolveLinkTos: boolean,
    onSubscriptionStart: (subscription) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<EventStoreCatchUpSubscription | void>;

  assertPersistentSubscriptions(
    subscription: IPersistentSubscriptionConfig,
    options: PersistentSubscriptionOptions,
  ): Promise<PersistentSubscriptionAssertResult | void>;

  updatePersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions: PersistentSubscriptionOptions,
    credentials: Credentials,
  ): Promise<void>;

  deletePersistentSubscription(
    streamName: string,
    group: string,
    deleteOptions?: any,
  ): Promise<void>;

  assertProjection(
    projection: EventStoreProjection,
    content?: string,
  ): Promise<void>;

  createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?: any,
  ): Promise<any>;

  updateProjection(projection: EventStoreProjection): Promise<void>;

  getProjectionState(streamName: string): Promise<any>;
}
