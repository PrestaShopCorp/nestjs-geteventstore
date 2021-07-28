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
  FORWARDS,
  jsonEvent,
  PersistentSubscription,
  ResolvedEvent,
  START,
} from '@eventstore/db-client';
import { Client } from '@eventstore/db-client/dist/Client';
import { GrpcEventStoreConfig } from '../../../config/grpc/grpc-event-store-config';
import EventStorePersistentSubscribtionGrpc from '../../../subscriptions/event-store-persistent-subscribtion-grpc';
import EventStorePersistentSubscribtionOptions from '../../../subscriptions/event-store-persistent-subscribtion-options';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import { ExpectedRevisionType } from '../../../events';

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
          resolveLinkTos: false,
          extraStats: false,
          fromRevision: 'start',
          messageTimeout: 30_000,
          maxRetryCount: 10,
          checkpointAfter: 2_000,
          minCheckpointCount: 10,
          maxCheckpointCount: 1_000,
          maxSubscriberCount: 'unlimited',
          liveBufferSize: 500,
          readBatchSize: 20,
          historyBufferSize: 500,
          strategy: 'round_robin',
          ...options,
        } as PersistentSubscriptionSettings,
      );
    } catch (e) {
      return;
    }
  }

  public assertProjection(
    projection: EventStoreProjection,
    content: string,
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async connect(): Promise<void> {
    this.client = EventStoreDBClient.connectionString(
      this.config.connectionSettings.connectionString,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
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

  public subscribeToPersistentSubscription(
    stream: string,
    group: string,
    onEvent: (sub, payload) => void,
    autoAck: boolean,
    bufferSize: number,
    onSubscriptionStart: (sub) => void,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): PersistentSubscription {
    return this.client.connectToPersistentSubscription(stream, group, {
      bufferSize,
    }) as EventStorePersistentSubscribtionGrpc;
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
    await this.client
      .appendToStream(
        stream,
        events.map((event) => {
          return jsonEvent({
            data: event.data,
            type: event.eventType,
            id: event.eventId,
          });
        }),
        { expectedRevision: expectedRevision as AppendExpectedRevision },
      )
      .catch((e) => console.log('e : ', e));
    const ezzz = await this.client.readStream(stream, {
      direction: FORWARDS,
      fromRevision: START,
    });

    for (const resolvedEvent of ezzz) {
      console.log(resolvedEvent.event.data);
    }
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
}
