import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import {
  createConnection,
  createJsonEventData,
  EventStoreNodeConnection,
  EventStorePersistentSubscription,
} from 'node-eventstore-client';
import * as geteventstorePromise from 'geteventstore-promise';
import { HTTPClient } from 'geteventstore-promise';
import { from, throwError } from 'rxjs';
import { catchError, flatMap, map, toArray } from 'rxjs/operators';

import { IEventStoreConfig, IWriteEvent } from '../interfaces';
import { ExpectedVersion } from './enum';
import { ISubscriptionStatus } from './interfaces';

export class EventStore {
  private logger: Logger = new Logger(this.constructor.name);
  public connection: EventStoreNodeConnection;
  public readonly HTTPClient: HTTPClient;
  public isConnected: boolean = false;
  private catchupSubscriptions: ISubscriptionStatus = {};
  private volatileSubscriptions: ISubscriptionStatus = {};
  private persistentSubscriptions: ISubscriptionStatus = {};

  constructor(public readonly config: IEventStoreConfig) {
    this.HTTPClient = new geteventstorePromise.HTTPClient({
      hostname: config.http.host.replace(/^https?:\/\//, ''),
      port: config.http.port,
      credentials: {
        username: config.credentials.username,
        password: config.credentials.password,
      },
    });
  }

  async connect() {
    this.connection = createConnection(
      {
        ...this.config.options,
        defaultUserCredentials: this.config.credentials,
      },
      this.config.tcp || this.config.clusterDns,
      this.config.tcpConnectionName,
    );
    this.logger.debug('Connecting to EventStore');
    await this.connection.connect();

    this.connection.on('connected', () => {
      this.logger.log('Connection to EventStore established!');
      this.isConnected = true;
      this.config.onTcpConnected(this);
    });
    this.connection.on('closed', () => {
      this.isConnected = false;
      this.logger.error('Connection to EventStore closed!');
      this.config.onTcpDisconnected(this);
    });
  }

  writeEvents(
    stream,
    events: IWriteEvent[],
    expectedVersion = ExpectedVersion.Any,
  ) {
    return from(events)
      .pipe(
        map((event) =>
          createJsonEventData(
            event.eventId || v4(),
            event.data || {},
            event.metadata || { version: 1, created_at: new Date() },
            event.constructor.name,
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
        flatMap((events) =>
          from(this.connection.appendToStream(stream, expectedVersion, events)),
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
      );
  }

  close() {
    this.connection.close();
  }

  get subscriptions(): {
    persistent: ISubscriptionStatus;
    catchup: ISubscriptionStatus;
  } {
    return {
      persistent: this.persistentSubscriptions,
      catchup: this.catchupSubscriptions,
    };
  }

  async readEventsForward({ stream, first = 0, count = 1000 }) {
    return await this.HTTPClient.readEventsForward(stream, first, count);
  }

  async subscribeToPersistentSubscription(
    stream: string,
    group: string,
    onEvent: (sub, payload) => void,
    autoAck: boolean = false,
    bufferSize: number = 10,
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
            this.persistentSubscriptions[
              `${stream}-${group}`
            ].isConnected = false;
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

  async subscribeToVolatileSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    resolveLinkTos: boolean = true,
    onSubscriptionStart: (subscription) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ) {
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

  async subscribeToCatchupSubscription(
    stream: string,
    onEvent: (sub, payload) => void,
    lastCheckpoint: number = 0,
    resolveLinkTos: boolean = true,
    onSubscriptionStart: (subscription) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ) {
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
}
