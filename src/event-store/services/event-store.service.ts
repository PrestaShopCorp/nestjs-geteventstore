import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { readFileSync } from 'fs';

import {
  EventStoreProjection,
  IPersistentSubscriptionConfig,
} from '../../interfaces';
import { ReadEventBus } from '../../cqrs';
import { EVENT_STORE_SUBSYSTEMS } from '../../constants';
import { IEventStoreSubsystems } from '../config';
import {
  AppendResult,
  BaseOptions,
  Credentials,
  StreamingRead,
} from '@eventstore/db-client/dist/types';
import { IEventStoreService } from './event-store.service.interface';
import * as constants from '@eventstore/db-client/dist/constants';
import { EventData } from '@eventstore/db-client/dist/types/events';
import {
  AppendToStreamOptions,
  GetStreamMetadataResult,
  ReadStreamOptions,
  SetStreamMetadataOptions,
} from '@eventstore/db-client/dist/streams';
import { ReadableOptions } from 'stream';
import {
  PersistentSubscription,
  persistentSubscriptionSettingsFromDefaults,
  ResolvedEvent,
} from '@eventstore/db-client';
import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { Client } from '@eventstore/db-client/dist/Client';
import { EVENT_STORE_CONNECTOR } from './event-store.constants';
import {
  CreateContinuousProjectionOptions,
  CreateOneTimeProjectionOptions,
  CreateTransientProjectionOptions,
  GetProjectionStateOptions,
} from '@eventstore/db-client/dist/projections';
import { DeletePersistentSubscriptionOptions } from '@eventstore/db-client/dist/persistentSubscription';
import {
  PERSISTENT_SUBSCRIPTION_ALREADY_EXIST_ERROR_CODE,
  PROJECTION_ALREADY_EXIST_ERROR_CODE,
} from './errors.constant';
import EventHandlerHelper from './event.handler.helper';
import IEventsAndMetadatasStacker, {
  EVENTS_AND_METADATAS_STACKER,
} from '../reliability/interface/events-and-metadatas-stacker';
import EventBatch from '../reliability/interface/event-batch';

@Injectable()
export class EventStoreService implements OnModuleInit, IEventStoreService {
  private logger: Logger = new Logger(this.constructor.name);
  private persistentSubscriptions: PersistentSubscription[];

  private isOnError = false;
  private isTryingToConnect = true;
  private isTryingToWriteEvents = false;
  private isTryingToWriteMetadatas = false;

  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStore: Client,
    @Inject(EVENT_STORE_SUBSYSTEMS)
    private readonly subsystems: IEventStoreSubsystems,
    @Inject(EVENTS_AND_METADATAS_STACKER)
    private readonly eventsStacker: IEventsAndMetadatasStacker,
    @Optional() private readonly eventBus?: ReadEventBus,
  ) {}

  public async onModuleInit(): Promise<void> {
    return await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      if (this.subsystems.projections)
        await this.assertProjections(this.subsystems.projections);
      if (this.subsystems.subscriptions)
        this.persistentSubscriptions =
          await this.subscribeToPersistentSubscriptions(
            this.subsystems.subscriptions.persistent,
          );

      this.isOnError = false;
      this.isTryingToConnect = false;
      this.logger.log(`EventStore connected`);
    } catch (e) {
      this.isTryingToConnect = true;
      await this.retryToConnect();
    }
  }

  private async retryToConnect(): Promise<void> {
    this.logger.log(`EventStore connection failed : trying to reconnect`);
    setTimeout(async () => await this.connect(), 1000);
  }

  public async createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?:
      | CreateContinuousProjectionOptions
      | CreateTransientProjectionOptions
      | CreateOneTimeProjectionOptions,
  ): Promise<void> {
    switch (type) {
      case 'continuous':
        this.eventStore
          .createContinuousProjection(projectionName, query, options ?? {})
          .catch(() => {
            // do nothing
          });
        break;
      case 'transient':
        this.eventStore.createTransientProjection(
          projectionName,
          query,
          options ?? {},
        );
        break;
      case 'oneTime': {
        this.eventStore.createOneTimeProjection(query, options ?? {});
        break;
      }
      default:
        return;
    }
  }

  public getProjectionState<T>(
    streamName: string,
    options?: GetProjectionStateOptions,
  ): Promise<T> {
    return this.eventStore.getProjectionState<T>(streamName, options);
  }

  public async updateProjections(
    projections: EventStoreProjection[],
  ): Promise<void> {
    projections.map(async (projection: EventStoreProjection) => {
      projection.content = this.extractProjectionContent(projection);
      await this.eventStore.updateProjection(
        projection.name,
        projection.content,
        {
          trackEmittedStreams: projection.trackEmittedStreams,
        },
      );
    });
  }

  private extractProjectionContent(projection: EventStoreProjection): string {
    let content;
    if (projection.content) {
      this.logger.log(`"${projection.name}" projection in content`);
      content = projection.content;
    } else if (projection.file) {
      this.logger.log(`"${projection.name}" projection in file`);
      content = readFileSync(projection.file, 'utf8');
    }
    return content;
  }

  public async assertProjections(
    projections: EventStoreProjection[],
  ): Promise<void> {
    for (const projection of projections) {
      this.logger.log(`Asserting projection "${projection.name}"...`);

      const content = this.extractProjectionContent(projection);
      await this.assertProjection(content, projection);

      this.logger.log(`Projection "${projection.name}" asserted !`);
    }
  }

  private async assertProjection(
    content: string,
    projection: EventStoreProjection,
  ): Promise<void> {
    try {
      await this.createProjection(
        content ?? projection.content,
        projection.mode,
        projection.name,
        {
          trackEmittedStreams: projection.trackEmittedStreams,
        },
      );
    } catch (e) {
      if (EventStoreService.isNotAProjectionAlreadyExistsError(e)) {
        this.logger.error(e);
        throw Error(e);
      }
      await this.updateProjections([projection]);
    }
  }

  public async createPersistentSubscription(
    streamName: string,
    groupName: string,
    settings: Partial<PersistentSubscriptionSettings>,
    options?: BaseOptions,
  ): Promise<void> {
    try {
      await this.eventStore.createPersistentSubscription(
        streamName,
        groupName,
        {
          ...persistentSubscriptionSettingsFromDefaults(),
          ...settings,
        },
        options,
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  public async updatePersistentSubscription(
    streamName: string,
    group: string,
    options: Partial<PersistentSubscriptionSettings>,
    credentials?: Credentials,
  ): Promise<void> {
    try {
      await this.eventStore.updatePersistentSubscription(
        streamName,
        group,
        {
          ...persistentSubscriptionSettingsFromDefaults(),
          ...options,
        } as PersistentSubscriptionSettings,
        { credentials },
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  public async deletePersistentSubscription(
    streamName: string,
    groupName: string,
    options?: DeletePersistentSubscriptionOptions,
  ): Promise<void> {
    try {
      await this.eventStore.deletePersistentSubscription(
        streamName,
        groupName,
        options,
      );
    } catch (e) {
      this.logger.error(`Error while deleting persistent subscription`);
      this.subsystems.onConnectionFail(e);
    }
  }

  public async subscribeToPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[] = [],
  ): Promise<PersistentSubscription[]> {
    await this.assertPersistentSubscriptions(subscriptions);

    return Promise.all(
      subscriptions.map(
        (config: IPersistentSubscriptionConfig): PersistentSubscription => {
          this.logger.log(
            `Connecting to persistent subscription "${config.group}" on stream "${config.stream}"`,
          );
          const onEvent = (subscription, payload) => {
            return this.subsystems.onEvent
              ? this.subsystems.onEvent(subscription, payload)
              : this.onEvent(subscription, payload);
          };
          const persistentSubscription: PersistentSubscription =
            this.eventStore.connectToPersistentSubscription(
              config.stream,
              config.group,
            );
          if (!isNil(onEvent)) {
            persistentSubscription.on('data', (subscription, payload) => {
              onEvent(subscription, payload);
            });
          }
          if (!isNil(config.onSubscriptionStart)) {
            persistentSubscription.on(
              'confirmation',
              config.onSubscriptionStart,
            );
          }
          if (!isNil(config.onSubscriptionDropped)) {
            persistentSubscription.on('close', config.onSubscriptionDropped);
          }

          persistentSubscription.on('error', config.onError);

          persistentSubscription.on('error', async (): Promise<void> => {
            if (!this.isTryingToConnect) await this.connect();
          });

          return persistentSubscription;
        },
      ),
    );
  }

  private async assertPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[],
  ): Promise<void> {
    for (const subscription of subscriptions) {
      await this.assertPersistentSubscription(subscription);
    }
  }

  private async assertPersistentSubscription(
    subscription: IPersistentSubscriptionConfig,
  ): Promise<void> {
    try {
      await this.eventStore.createPersistentSubscription(
        subscription.stream,
        subscription.group,
        {
          ...persistentSubscriptionSettingsFromDefaults(),
          ...subscription.settingsForCreation?.subscriptionSettings,
        },
        subscription.settingsForCreation?.baseOptions,
      );
      this.logger.log(
        `Persistent subscription "${subscription.group}" on stream ${subscription.stream} created.`,
      );
    } catch (e) {
      if (EventStoreService.isNotAlreadyExistsError(e)) {
        this.logger.error('Subscription creation try : ', e);
        throw new Error(e);
      }
      await this.eventStore.updatePersistentSubscription(
        subscription.stream,
        subscription.group,
        {
          ...persistentSubscriptionSettingsFromDefaults(),
          ...subscription.settingsForCreation.subscriptionSettings,
        },
        subscription.settingsForCreation.baseOptions,
      );
    }
  }

  private static isNotAlreadyExistsError(e) {
    return e.code !== PERSISTENT_SUBSCRIPTION_ALREADY_EXIST_ERROR_CODE;
  }

  private static isNotAProjectionAlreadyExistsError(e) {
    return e.code !== PROJECTION_ALREADY_EXIST_ERROR_CODE;
  }

  public getPersistentSubscriptions(): PersistentSubscription[] {
    return this.persistentSubscriptions;
  }

  public readMetadata(stream: string): Promise<GetStreamMetadataResult> {
    try {
      return this.eventStore.getStreamMetadata(stream);
    } catch (e) {
      this.logger.error(`Error while reading metadatas of stream ${stream}`);
      this.subsystems.onConnectionFail(e);
    }
  }

  public async writeMetadata(
    streamName: string,
    metadata: StreamMetadata,
    options?: SetStreamMetadataOptions,
  ): Promise<AppendResult> {
    this.eventsStacker.putMetadatasInWaitingLine({
      streamName,
      metadata,
      options,
    });

    return this.isTryingToWriteMetadatas
      ? null
      : await this.writeStackedMetadatas(streamName, metadata, options);
  }

  private async writeStackedMetadatas(
    streamName: string,
    metadata: StreamMetadata,
    options: SetStreamMetadataOptions,
  ) {
    try {
      this.isTryingToWriteMetadatas = true;
      let lastValidAppendResult: AppendResult = null;
      while (this.eventsStacker.getMetadatasWaitingLineLength() > 0) {
        lastValidAppendResult = await this.eventStore.setStreamMetadata(
          streamName,
          metadata,
          options,
        );
        this.eventsStacker.shiftMetadatasFromWaitingLine();
      }
      this.isTryingToWriteMetadatas = false;
      return lastValidAppendResult;
    } catch (e) {
      this.subsystems.onConnectionFail(e);
      return null;
    }
  }

  public async readFromStream(
    stream: string,
    options?: ReadStreamOptions,
    readableOptions?: ReadableOptions,
  ): Promise<StreamingRead<ResolvedEvent>> {
    try {
      return this.eventStore.readStream(stream, options, readableOptions);
    } catch (e) {
      this.logger.error(`Error while reading a stream`);
      this.subsystems.onConnectionFail(e);
    }
  }

  public async writeEvents(
    stream: string,
    events: EventData[],
    expectedVersion: AppendToStreamOptions = {
      expectedRevision: constants.ANY,
    },
  ): Promise<AppendResult> {
    this.eventsStacker.putEventsInWaitingLine({
      events,
      stream,
      expectedVersion,
    });
    return this.isTryingToWriteEvents
      ? null
      : await this.tryToWriteStackedEventBatches();
  }

  private async tryToWriteStackedEventBatches(): Promise<AppendResult> {
    let lastValidAppendResult: AppendResult = null;
    this.isTryingToWriteEvents = true;

    while (this.eventsStacker.getEventBatchesWaitingLineLength() > 0) {
      lastValidAppendResult = await this.tryToWriteEventsFromBatch();
    }

    this.isTryingToWriteEvents = false;
    return lastValidAppendResult;
  }

  private async tryToWriteEventsFromBatch() {
    try {
      const batch: EventBatch =
        this.eventsStacker.getFirstOutFromEventsBatchesWaitingLine();
      const appendResult: AppendResult = await this.eventStore.appendToStream(
        batch.stream,
        batch.events,
        batch.expectedVersion,
      );
      this.eventsStacker.shiftEventsBatchFromWaitingLine();

      return appendResult;
    } catch (e) {
      this.subsystems.onConnectionFail(e);
      return null;
    }
  }

  private async onEvent(
    subscription: IPersistentSubscriptionConfig,
    payload,
  ): Promise<unknown> {
    return EventHandlerHelper.onEvent(
      this.logger,
      subscription,
      payload,
      this.eventBus,
    );
  }
}
