import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import {
  createConnection,
  createJsonEventData,
  EventData,
  EventStoreCatchUpSubscription,
  EventStoreNodeConnection,
  EventStorePersistentSubscription,
  EventStoreSubscription,
  WriteResult,
} from 'node-eventstore-client';
import * as geteventstorePromise from 'geteventstore-promise';
import {
  HTTPClient,
  PersistentSubscriptionAssertResult,
  ProjectionMode,
} from 'geteventstore-promise';
import { from, Observable, throwError } from 'rxjs';
import { catchError, flatMap, map, toArray } from 'rxjs/operators';

import {
  EventStoreProjection,
  IPersistentSubscriptionConfig,
  ISubscriptionStatus,
  IWriteEvent,
} from '../../../../interfaces';
import { createEventDefaultMetadata } from '../../../../tools/create-event-default-metadata';
import EventStoreConnector from '../../interface/event-store-connector';
import { IEventStoreConfig } from '../../../config';
import TcpHttpEventStoreConfig from '../../../config/tcp-http/tcp-http-event-store.config';
import { ExpectedRevision } from '../../../events';
import { Credentials } from '@eventstore/db-client/dist/types';
import { PersistentSubscriptionOptions } from '../../interface/persistent-subscriptions-options';

export class TcpHttpEventStore implements EventStoreConnector {
  public connection: EventStoreNodeConnection;
  public readonly HTTPClient: HTTPClient;

  private logger: Logger = new Logger(this.constructor.name);

  private _isConnected = false;

  private catchupSubscriptions: ISubscriptionStatus = {};
  private volatileSubscriptions: ISubscriptionStatus = {};
  private persistentSubscriptions: ISubscriptionStatus = {};

  constructor(private readonly config: TcpHttpEventStoreConfig) {
    this.HTTPClient = new geteventstorePromise.HTTPClient({
      hostname: config.http.host.replace(/^https?:\/\//, ''),
      port: config.http.port,
      credentials: {
        username: config.credentials.username,
        password: config.credentials.password,
      },
    });
    this.initTcpConnection();
  }

  public getConfig(): IEventStoreConfig {
    return this.config;
  }

  private initTcpConnection() {
    this.connection = createConnection(
      {
        ...this.config.options,
        verboseLogging: true,
        defaultUserCredentials: this.config.credentials,
      },
      this.config.tcp || this.config.clusterDns,
      this.config.tcpConnectionName,
    );
  }

  public async connect(): Promise<void> {
    this.logger.debug('Connecting to EventStore');
    await this.connection.connect();

    this.connection.on('connected', () => {
      this.logger.log('Connection to EventStore established!');
      this._isConnected = true;
      this.config.onTcpConnected(this);
    });
    this.connection.on('closed', () => {
      this._isConnected = false;
      this.logger.error('Connection to EventStore closed!');
      this.config.onTcpDisconnected(this);
    });
  }

  public writeEvents(
    stream,
    events: IWriteEvent[],
    expectedVersion = ExpectedRevision.Any,
  ): Promise<WriteResult> {
    return from(events)
      .pipe(
        map((event: IWriteEvent) =>
          createJsonEventData(
            event.eventId || v4(),
            event.data || {},
            event.metadata
              ? { ...createEventDefaultMetadata(), ...event.metadata }
              : createEventDefaultMetadata(),
            event.eventType || event.constructor.name,
          ),
        ),
        catchError((err) => {
          return throwError({
            message: `Unable to convert event to EventStore event : ${err.message}`,
            response: { status: 400 },
          });
        }),
        toArray(),
      )
      .pipe(
        //tap(esEvents => console.log('Writing events', stream, esEvents)),
        flatMap((events: EventData[]) =>
          from(
            this.connection.appendToStream(
              stream,
              ExpectedRevision.convertRevisionToVersion(expectedVersion),
              events,
            ),
          ),
        ),
        catchError((err) => {
          if (err.response) {
            err.message = err.message + ' : ' + err.response.statusText;
          }
          return throwError({
            ...err,
            message: `Error appending ${events.length} events to stream ${stream} : ${err.message}`,
          });
        }),
      )
      .toPromise();
  }

  public writeMetadata(
    stream: string,
    expectedStreamMetadataVersion = ExpectedRevision.Any,
    streamMetadata: any,
  ): Observable<WriteResult> {
    return from(
      this.connection.setStreamMetadataRaw(
        stream,
        ExpectedRevision.convertRevisionToVersion(
          expectedStreamMetadataVersion,
        ),
        streamMetadata,
      ),
    ).pipe(
      catchError((err) => {
        const message = err.message.err.response ? err.response.statusText : '';
        return throwError({
          ...err,
          message: `Error appending metadata to stream ${stream} : ${message}`,
        });
      }),
    );
  }

  public disconnect(): void {
    this.connection.close();
  }

  public getSubscriptions(): {
    persistent: ISubscriptionStatus;
    catchup: ISubscriptionStatus;
  } {
    return {
      persistent: this.persistentSubscriptions,
      catchup: this.catchupSubscriptions,
    };
  }

  // public async readEventsForward({stream, first = 0, count = 1000}): Promise<HTTPReadResult> {
  //     return await this.HTTPClient.readEventsForward(stream, first, count);
  // }

  public async subscribeToPersistentSubscription(
    stream: string,
    group: string,
    onEvent: (sub, payload) => void,
    autoAck = false,
    bufferSize = 10,
    onSubscriptionStart: (sub) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ): Promise<EventStorePersistentSubscription> {
    try {
      return await this.connection
        .connectToPersistentSubscription(
          stream,
          group,
          onEvent,
          (subscription, reason, error) => {
            this.logger.warn(
              `Connected to persistent subscription ${group} on stream ${stream} dropped ${reason} : ${error}`,
            );
            this.persistentSubscriptions[`${stream}-${group}`].isConnected =
              false;
            this.persistentSubscriptions[`${stream}-${group}`].status =
              reason + ' ' + error;
            if (onSubscriptionDropped) {
              onSubscriptionDropped(subscription, reason, error);
            }
          },
          undefined,
          bufferSize,
          autoAck,
        )
        .then((subscription) => {
          this.logger.log(
            `Connected to persistent subscription ${group} on stream ${stream}!`,
          );
          this.persistentSubscriptions[`${stream}-${group}`] = {
            isConnected: true,
            streamName: stream,
            group: group,
            subscription: subscription,
            status: `Connected to persistent subscription ${group} on stream ${stream}!`,
          };
          if (onSubscriptionStart) {
            onSubscriptionStart(subscription);
          }
          return subscription;
        });
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  public async subscribeToVolatileSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    resolveLinkTos = true,
    onSubscriptionStart: (subscription) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ): Promise<EventStoreSubscription> {
    this.logger.log(`Catching up and subscribing to stream ${stream}!`);
    try {
      const subscription = await this.connection.subscribeToStream(
        stream,
        resolveLinkTos,
        onEvent,
        (subscription, reason, error) => {
          this.catchupSubscriptions[stream].isConnected = false;
          if (onSubscriptionDropped) {
            onSubscriptionDropped(subscription, reason, error);
          }
        },
      );

      this.volatileSubscriptions[stream] = {
        isConnected: true,
        streamName: stream,
        subscription: subscription,
        status: `Connected volatile subscription on stream ${stream}!`,
      };
      return subscription;
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  public async subscribeToCatchupSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    lastCheckpoint = 0,
    resolveLinkTos = true,
    onSubscriptionStart: (subscription) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ): Promise<EventStoreCatchUpSubscription | void> {
    this.logger.log(`Catching up and subscribing to stream ${stream}!`);
    try {
      return await this.connection.subscribeToStreamFrom(
        stream,
        lastCheckpoint,
        resolveLinkTos,
        onEvent,
        (subscription) => {
          this.catchupSubscriptions[stream] = {
            isConnected: true,
            streamName: stream,
            subscription: subscription,
            status: `Connected catchup subscription on stream ${stream}!`,
          };
          if (onSubscriptionStart) {
            onSubscriptionStart(subscription);
          }
        },
        (subscription, reason, error) => {
          this.catchupSubscriptions[stream].isConnected = false;
          if (onSubscriptionDropped) {
            onSubscriptionDropped(subscription, reason, error);
          }
        },
      );
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  // public async getProjectionState(name: string, partition?: string) {
  //     return await this.HTTPClient.projections.getState(name, {partition});
  // }

  public async getPersistentSubscriptionInfo(
    subscription: IPersistentSubscriptionConfig,
  ) {
    return this.HTTPClient.persistentSubscriptions.getSubscriptionInfo(
      subscription.group,
      subscription.stream,
    );
  }

  public async assertProjection(
    projection: EventStoreProjection,
    content: string,
  ) {
    return this.HTTPClient.projections.assert(
      projection.name,
      content,
      projection.mode as ProjectionMode,
      projection.enabled,
      projection.checkPointsEnabled,
      projection.emitEnabled,
      projection.trackEmittedStreams,
    );
  }

  public async assertPersistentSubscriptions(
    subscription: IPersistentSubscriptionConfig,
    options: PersistentSubscriptionOptions,
  ): Promise<PersistentSubscriptionAssertResult> {
    return this.HTTPClient.persistentSubscriptions.assert(
      subscription.group,
      subscription.stream,
      options as unknown,
    );
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public readFromStream(stream: string, options?: any) {
    throw new Error('not implemented in this version');
  }

  public readMetadata(stream: string): Observable<any> {
    throw new Error('not implemented in this version');
  }

  public async createPersistentSubscription(
    stream: string,
    group: string,
    settings: PersistentSubscriptionOptions,
    credentials?: Credentials,
  ): Promise<void> {
    throw new Error('not implemented in this version');
  }

  public async updatePersistentSubscription(
    streamName: string,
    group: string,
    persistentSubscriptionOptions: PersistentSubscriptionOptions,
    credentials: Credentials,
  ): Promise<void> {
    throw new Error('not implemented in this version');
  }

  public createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
  ): Promise<void> {
    throw new Error('not implemented in this version');
  }

  public getProjectionState(streamName: string): Promise<any> {
    throw new Error('not implemented in this version');
  }

  public deletPersistentSubscription(
    streamName: string,
    group: string,
    deleteOptions?: any,
  ): Promise<void> {
    throw new Error('not implemented in this version');
  }
}
