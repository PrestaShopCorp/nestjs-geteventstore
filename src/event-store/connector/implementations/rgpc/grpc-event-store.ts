import { Logger } from '@nestjs/common';
import {
  EventStoreCatchUpSubscription,
  EventStoreSubscription,
} from 'node-eventstore-client';
import { from, Observable } from 'rxjs';

import {
  EventStoreProjection,
  IBaseEvent,
  IPersistentSubscriptionConfig,
  ISubscriptionStatus,
  IWriteEvent,
} from '../../../../interfaces';
import EventStoreConnector from '../../interface/event-store-connector';
import {
  AppendExpectedRevision,
  AppendResult,
  EventStoreDBClient,
  EventType,
  jsonEvent,
  PersistentSubscription,
  ResolvedEvent,
} from '@eventstore/db-client';
import { Client } from '@eventstore/db-client/dist/Client';
import { GrpcEventStoreConfig } from '../../../config/grpc/grpc-event-store-config';
import EventStorePersistentSubscribtionOptions from '../../../subscriptions/event-store-persistent-subscribtion-options';
import { ExpectedRevisionType } from '../../../events';
import { Credentials } from '@eventstore/db-client/dist/types';
import { PersistentSubscriptionOptions } from '../../interface/persistent-subscriptions-options';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import { isNil } from '@nestjs/common/utils/shared.utils';

export class RGPCEventStore implements EventStoreConnector {
  private logger: Logger = new Logger(this.constructor.name);
  private client: Client;

  constructor(private readonly config: GrpcEventStoreConfig) {
    this.logger.log('Instantiating gRPC connector client');
  }

  public getConfig(): GrpcEventStoreConfig {
    return this.config;
  }

  public async assertPersistentSubscriptions(
    subscription: IPersistentSubscriptionConfig,
    options: EventStorePersistentSubscribtionOptions,
  ): Promise<void> {
    try {
      await this.client.createPersistentSubscription(
        subscription.stream,
        subscription.group,
        {
          ...PersistentSubscriptionOptions.getDefaultOptions(),
          ...options,
        } as PersistentSubscriptionSettings,
      );
    } catch (e) {
      return;
    }
  }

  public async connect(): Promise<void> {
    this.client = EventStoreDBClient.connectionString(
      this.config.connectionSettings.connectionString,
    );
  }

  public disconnect(): void {}

  public async getPersistentSubscriptionInfo(
    subscription: IPersistentSubscriptionConfig,
  ): Promise<void> {
    throw {
      response: {
        message: 'Try creating one directly.',
        status: 404,
      },
    };
  }

  public getSubscriptions(): {
    persistent: ISubscriptionStatus;
    catchup: ISubscriptionStatus;
  } {
    return { catchup: undefined, persistent: undefined };
  }

  public isConnected(): boolean {
    return true;
  }

  public subscribeToCatchupSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    lastCheckpoint: number,
    resolveLinkTos: boolean,
    onSubscriptionStart: (subscription) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<EventStoreCatchUpSubscription | void> {
    return Promise.resolve(undefined);
  }

  public async subscribeToPersistentSubscription(
    stream: string,
    group: string,
    onEvent: (sub, payload) => void,
    autoAck: boolean,
    bufferSize: number,
    onSubscriptionStart: (sub) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<PersistentSubscription> {
    const persistentSubscription: PersistentSubscription =
      this.client.connectToPersistentSubscription(stream, group, {
        bufferSize,
      });
    if (!isNil(onEvent)) {
      persistentSubscription.on('data', onEvent);
    }
    if (!isNil(onSubscriptionStart)) {
      persistentSubscription.on('confirmation', onSubscriptionStart);
    }
    if (!isNil(onSubscriptionDropped)) {
      persistentSubscription.on('close', onSubscriptionDropped);
    }

    return persistentSubscription;
  }

  public subscribeToVolatileSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    resolveLinkTos: boolean,
    onSubscriptionStart: (subscription) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<EventStoreSubscription> {
    return Promise.resolve(undefined);
  }

  public async writeEvents(
    stream: string,
    events: IWriteEvent[],
    expectedRevision: ExpectedRevisionType,
  ): Promise<void> {
    if (events.length === 0) {
      return null;
    }
    await this.client.appendToStream(
      stream,
      events.map((event) => {
        return jsonEvent({
          data: event.data,
          type: event.eventType,
          id: event.eventId,
        });
      }),
      { expectedRevision: expectedRevision as AppendExpectedRevision },
    );
  }

  public writeMetadata(
    stream: string,
    expectedRevision: any,
    streamMetadata: any,
  ): Observable<AppendResult> {
    return from(
      this.client.setStreamMetadata(stream, streamMetadata, {
        expectedRevision,
      }),
    );
  }

  public readMetadata(stream: string): Observable<any> {
    return from(this.client.getStreamMetadata(stream));
  }

  public async readFromStream(
    stream: string,
    options: any,
  ): Promise<IBaseEvent[]> {
    const events: ResolvedEvent<EventType>[] = await this.client.readStream(
      stream,
      {
        direction: options.direction,
        fromRevision: options.fromRevision,
        maxCount: options.maxCount,
      },
    );

    return events.map((event: ResolvedEvent<EventType>): IBaseEvent => {
      return {
        data: event.event.data,
        eventId: event.event.id,
        eventType: event.event.type,
        metadata: event.event.metadata as unknown,
      };
    });
  }

  public async createPersistentSubscription(
    stream: string,
    group: string,
    options: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void> {
    return await this.client.createPersistentSubscription(
      stream,
      group,
      {
        ...PersistentSubscriptionOptions.getDefaultOptions(),
        ...options,
      } as PersistentSubscriptionSettings,
      {
        credentials,
      },
    );
  }

  public async updatePersistentSubscription(
    streamName: string,
    group: string,
    options: PersistentSubscriptionOptions,
    credentials: Credentials,
  ): Promise<void> {
    return await this.client.updatePersistentSubscription(
      streamName,
      group,
      {
        ...PersistentSubscriptionOptions.getDefaultOptions(),
        ...options,
      } as PersistentSubscriptionSettings,
      { credentials },
    );
  }

  public async deletPersistentSubscription(
    streamName: string,
    group: string,
    deleteOptions?: any,
  ): Promise<void> {
    await this.client.deletePersistentSubscription(
      streamName,
      group,
      deleteOptions,
    );
  }

  public async createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?: any,
  ): Promise<any> {
    switch (type) {
      case 'continuous':
        return await this.client.createContinuousProjection(
          projectionName,
          query,
          options ?? {},
        );
      case 'transient':
        return await this.client.createTransientProjection(
          projectionName,
          query,
          options ?? {},
        );
      case 'oneTime': {
        await this.client.createOneTimeProjection(query, options ?? {});
      }
    }
  }

  public assertProjection(
    projection: EventStoreProjection,
    content: string,
  ): Promise<void> {
    return this.createProjection(
      content ?? projection.content,
      projection.mode,
      projection.name,
      {
        trackEmittedStreams: projection.trackEmittedStreams,
      },
    ).catch((e) => console.log('e : ', e));
  }

  public async getProjectionState(projectionName: string): Promise<void> {
    return this.client.getProjectionState(projectionName);
  }

  public async updateProjection(
    projection: EventStoreProjection,
  ): Promise<void> {
    return this.client.updateProjection(projection.name, projection.content, {
      trackEmittedStreams: projection.trackEmittedStreams,
    });
  }
}
