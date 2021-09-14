import {
  EventStoreProjection,
  IPersistentSubscriptionConfig,
} from '../../interfaces';
import {
  CreateContinuousProjectionOptions,
  CreateOneTimeProjectionOptions,
  CreateTransientProjectionOptions,
  GetProjectionStateOptions,
} from '@eventstore/db-client/dist/projections';
import { DeletePersistentSubscriptionOptions } from '@eventstore/db-client/dist/persistentSubscription';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import {
  AppendResult,
  BaseOptions,
  Credentials,
  StreamingRead,
} from '@eventstore/db-client/dist/types';
import {
  AppendToStreamOptions,
  GetStreamMetadataResult,
  ReadStreamOptions,
  SetStreamMetadataOptions,
} from '@eventstore/db-client/dist/streams';
import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';
import { ReadableOptions } from 'stream';
import { PersistentSubscription, ResolvedEvent } from '@eventstore/db-client';
import { EventData } from '@eventstore/db-client/dist/types/events';

export const EVENT_STORE_SERVICE = Symbol();

export interface IEventStoreService {
  createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?:
      | CreateContinuousProjectionOptions
      | CreateTransientProjectionOptions
      | CreateOneTimeProjectionOptions,
  ): Promise<void>;

  getProjectionState<T>(
    streamName: string,
    options?: GetProjectionStateOptions,
  ): Promise<T>;

  updateProjection(
    projection: EventStoreProjection,
    content: string,
  ): Promise<void>;

  upsertProjections(projections: EventStoreProjection[]): Promise<void>;

  createPersistentSubscription(
    streamName: string,
    groupName: string,
    settings: Partial<PersistentSubscriptionSettings>,
    options?: BaseOptions,
  ): Promise<void>;

  updatePersistentSubscription(
    streamName: string,
    group: string,
    options: Partial<PersistentSubscriptionSettings>,
    credentials?: Credentials,
  ): Promise<void>;

  deletePersistentSubscription(
    streamName: string,
    groupName: string,
    options?: DeletePersistentSubscriptionOptions,
  ): Promise<void>;

  subscribeToPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[],
  ): Promise<PersistentSubscription[]>;

  getPersistentSubscriptions(): PersistentSubscription[];

  readMetadata(stream: string): Promise<GetStreamMetadataResult>;

  writeMetadata(
    streamName: string,
    metadata: StreamMetadata,
    options?: SetStreamMetadataOptions,
  ): Promise<AppendResult>;

  readFromStream(
    stream: string,
    options?: ReadStreamOptions,
    readableOptions?: ReadableOptions,
  ): Promise<StreamingRead<ResolvedEvent>>;

  writeEvents(
    stream: string,
    events: EventData[],
    expectedVersion: AppendToStreamOptions,
  ): Promise<AppendResult>;
}
