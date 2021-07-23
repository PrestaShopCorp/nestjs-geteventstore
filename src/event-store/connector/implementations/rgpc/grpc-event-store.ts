import { Logger } from '@nestjs/common';
import {
  EventStoreCatchUpSubscription,
  EventStoreSubscription,
  WriteResult,
} from 'node-eventstore-client';
import { Observable } from 'rxjs';

import {
  EventStoreProjection,
  IPersistentSubscriptionConfig,
  ISubscriptionStatus,
  IWriteEvent,
} from '../../../../interfaces';
import EventStoreConnector from '../../interface/event-store-connector';
import {
  EventStoreDBClient,
  PersistentSubscription,
} from '@eventstore/db-client';
import { Client } from '@eventstore/db-client/dist/Client';
import { GrpcEventStoreConfig } from '../../../config/grpc/grpc-event-store-config';
import EventStorePersistentSubscribtionGrpc
  from '../../../subscriptions/event-store-persistent-subscribtion-grpc';
import EventStorePersistentSubscribtionOptions
  from '../../../subscriptions/event-store-persistent-subscribtion-options';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';

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

  public disconnect(): void {
  }

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

  public writeEvents(
    stream,
    events: IWriteEvent[],
    expectedVersion,
  ): Observable<WriteResult> {
    return undefined;
  }

  public writeMetadata(
    stream,
    expectedStreamMetadataVersion,
    streamMetadata: any,
  ): Observable<WriteResult> {
    return undefined;
  }
}
