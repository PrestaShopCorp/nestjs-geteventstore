import { WriteResult } from 'node-eventstore-client';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { readFileSync } from 'fs';

import {
  EventStoreProjection,
  IBaseEvent,
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
  IWriteEvent,
} from '../../interfaces';
import { ReadEventBus } from '../../cqrs';
import { EVENT_STORE_SERVICE_CONFIG } from '../../constants';
import { Observable } from 'rxjs';
import EventStoreConnector, {
  EVENT_STORE_CONNECTOR,
} from '../connector/interface/event-store-connector';
import { IEventStoreServiceConfig } from '../config';
import { ExpectedRevision, ExpectedRevisionType } from '../events';
import { AppendResult } from '@eventstore/db-client';
import { Credentials } from '@eventstore/db-client/dist/types';
import { PersistentSubscriptionOptions } from '../connector/interface/persistent-subscriptions-options';
import { IEventStoreService } from './interfaces/event-store.service.interface';
import {
  EVENT_STORE_EVENT_HANDLER,
  IEventHandler,
} from './event.handler.interface';

@Injectable()
export class EventStoreService
  implements OnModuleDestroy, OnModuleInit, IEventStoreService
{
  private logger: Logger = new Logger(this.constructor.name);

  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStore: EventStoreConnector,
    @Inject(EVENT_STORE_SERVICE_CONFIG)
    private readonly config: IEventStoreServiceConfig,
    @Inject(EVENT_STORE_EVENT_HANDLER)
    private readonly eventHandler: IEventHandler,
    @Optional() private readonly eventBus?: ReadEventBus,
  ) {}

  public async onModuleInit(): Promise<void> {
    return await this.connect();
  }

  public onModuleDestroy(): void {
    this.logger.log(`Destroy, disconnect EventStore`);
    this.eventStore.disconnect();
  }

  public async connect(): Promise<void> {
    await this.eventStore.connect();
    this.logger.debug(`EventStore connected`);

    await this.assertProjections(this.config.projections || []);
    if (this.config.subscriptions) {
      await this.subscribeToCatchUpSubscriptions(
        this.config.subscriptions.catchup || [],
      );
      await this.subscribeToVolatileSubscriptions(
        this.config.subscriptions.volatile || [],
      );
      await this.subscribeToPersistentSubscriptions(
        this.config.subscriptions.persistent || [],
      );
    }
  }

  public async subscribeToCatchUpSubscriptions(
    subscriptions: ICatchupSubscriptionConfig[],
  ): Promise<unknown> {
    return await Promise.all(
      subscriptions.map((config: ICatchupSubscriptionConfig) => {
        return this.eventStore.subscribeToCatchupSubscription(
          config.stream,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.lastCheckpoint,
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  public async subscribeToVolatileSubscriptions(
    subscriptions: IVolatileSubscriptionConfig[],
  ): Promise<unknown> {
    return await Promise.all(
      subscriptions.map((config: IVolatileSubscriptionConfig) => {
        return this.eventStore.subscribeToVolatileSubscription(
          config.stream,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  public async subscribeToPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[],
  ): Promise<unknown> {
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          this.logger.log(
            `Check if persistent subscription "${subscription.group}" on stream ${subscription.stream} needs to be created `,
          );
          if (subscription.options?.resolveLinktos !== undefined) {
            this.logger.warn(
              "DEPRECATED: The resolveLinktos parameter shouln't be used anymore. The resolveLinkTos parameter should be used instead.",
            );
          }
          await this.eventStore.getPersistentSubscriptionInfo(subscription);
        } catch (e) {
          if (!e.response || e.response.status != 404) {
            throw e;
          }
          const options: PersistentSubscriptionOptions = {
            ...subscription.options,
            ...{
              resolveLinkTos:
                subscription.options?.resolveLinkTos ||
                subscription.options?.resolveLinktos,
            },
          };
          await this.eventStore.assertPersistentSubscriptions(
            subscription,
            options,
          );
          this.logger.log(
            `Persistent subscription "${subscription.group}" on stream ${subscription.stream} created ! ` +
              JSON.stringify(subscription.options),
          );
        }
      }),
    );
    return await Promise.all(
      subscriptions.map(async (config) => {
        this.logger.log(
          `Connecting to persistent subscription "${config.group}" on stream ${config.stream}`,
        );
        return this.eventStore.subscribeToPersistentSubscription(
          config.stream,
          config.group,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.autoAck,
          config.bufferSize,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  private async onEvent(subscription, payload): Promise<any> {
    // use configured onEvent
    if (this.config.onEvent) {
      return await this.onEvent(subscription, payload);
    }

    return this.eventHandler.onEvent(subscription, payload);
  }

  public writeEvents(
    stream: string,
    events: IWriteEvent[],
    expectedVersion = ExpectedRevision.Any,
  ): Promise<WriteResult | void> {
    return this.eventStore.writeEvents(stream, events, expectedVersion);
  }

  public readFromStream(
    stream: string,
    options: {
      maxCount?: number;
      fromRevision?: 'start' | 'end' | BigInt;
      resolveLinkTos?: boolean;
      direction?: 'forwards' | 'backwards';
    },
  ): Promise<IBaseEvent[]> {
    return this.eventStore.readFromStream(stream, options);
  }

  public writeMetadata(
    stream: string,
    expectedStreamMetadataVersion: ExpectedRevisionType = ExpectedRevision.Any,
    streamMetadata: unknown,
  ): Observable<WriteResult | AppendResult> {
    return this.eventStore.writeMetadata(
      stream,
      expectedStreamMetadataVersion,
      streamMetadata,
    );
  }

  public readMetadata(stream: string): Observable<any> {
    return this.eventStore.readMetadata(stream);
  }

  public async createPersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions?: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void> {
    await this.eventStore.createPersistentSubscription(
      streamName,
      group,
      persistentSubscriptionOptions,
      credentials,
    );
  }

  public async updatePersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void> {
    await this.eventStore.updatePersistentSubscription(
      streamName,
      group,
      persistentSubscriptionOptions,
      credentials,
    );
  }

  public async deletePersistentSubscription(
    streamName: string,
    group: string,
  ): Promise<void> {
    await this.eventStore.deletPersistentSubscription(streamName, group);
  }

  public async assertProjections(
    projections: EventStoreProjection[],
  ): Promise<void> {
    await Promise.all(
      projections.map(async (projection) => {
        this.logger.log(`Asserting projection "${projection.name}"...`);
        const content = this.extractProjectionContent(projection);
        await this.eventStore.assertProjection(projection, content);
        this.logger.log(`Projection "${projection.name}" asserted !`);
      }),
    );
  }

  public async createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?: any,
  ): Promise<any> {
    return this.eventStore.createProjection(
      query,
      type,
      projectionName,
      options,
    );
  }

  public getProjectionState(streamName: string): Promise<any> {
    return this.eventStore.getProjectionState(streamName);
  }

  public async updateProjections(
    projections: EventStoreProjection[],
  ): Promise<void> {
    projections.map(async (projection: EventStoreProjection) => {
      projection.content = this.extractProjectionContent(projection);
      await this.eventStore.updateProjection(projection);
    });
  }

  public extractProjectionContent(projection: EventStoreProjection) {
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
}
