import { createConnection, EventStoreNodeConnection, expectedVersion } from 'node-eventstore-client';
import * as geteventstorePromise from 'geteventstore-promise';
import { HTTPClient } from 'geteventstore-promise';
import { from, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import * as fp from 'lodash/fp';
import { catchError, flatMap, map, toArray } from 'rxjs/operators';
import { ExpectedVersion } from './interfaces/event.interface';
import { IEvent } from '@nestjs/cqrs';
import { IEventStoreConfig } from './interfaces/event-store-config.interface';


// FIXME still needed ?
export class EventStore {
  connection: EventStoreNodeConnection;
  expectedVersion: any;
  isConnected: boolean = false;
  HTTPClient: HTTPClient;
  connectionCount: number = 0;

  private logger: Logger = new Logger(this.constructor.name);
  _addDefaultVersion: any;
  _toEventstoreEvent: (e: any) => any;

  constructor(
    public readonly config: IEventStoreConfig,
  ) {
    this.HTTPClient = new geteventstorePromise.HTTPClient({
      hostname: config.http.host.replace(/^https?:\/\//, ''),
      port: config.http.port,
      credentials: {
        username: config.credentials.username,
        password: config.credentials.password,
      },
    });
    this.expectedVersion = expectedVersion;
    this._addDefaultVersion = fp.merge({ metadata: { version: 1 } });
    this._toEventstoreEvent = e =>
      new geteventstorePromise.EventFactory().newEvent(
        e.type || e.constructor.name,
        e.data,
        e.metadata,
        e.id,
      );
  }

  async connect() {
    this.connection = createConnection(
      { defaultUserCredentials: this.config.credentials },
      this.config.tcp,
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
      this.config.onTcpDisconnected(this);

      // TODO is this the place to reconnect
      // Move to strategy
      if (this.connectionCount <= 10) {
        this.connectionCount += 1;
      } else {
        throw new Error('To many eventStore connect retrys');
      }
      this.logger.error('Connection to EventStore closed!');
      this.connect();
    });
  }

  writeEvents(stream, events: IEvent[], expectedVersion = ExpectedVersion.Any) {
    return from(events)
      .pipe(
        map(this._toEventstoreEvent),
        // If the event is invalid (if _toEventstoreEvent throw an exception), return a 400 error
        catchError(err => {
          return throwError({
            message: `Unable to convert event to Eventstore event : ${err.message}`,
            response: { status: 400 },
          });
        }),
        toArray(),
      ).pipe(
        //tap(esEvents => console.log('Writing events', stream)),
        flatMap(esEvents =>
          from(this.connection.appendToStream(stream, expectedVersion, esEvents)),// TODO chose writer (HTTP/TCP) and strategy
        ),
        catchError(err => {
          return throwError({
            ...err,
            message: `Error appending ${events.length} events (ie ${events.shift().constructor.name}) to stream ${stream} : ${err.message}`,
          });
        }),
      );
  }

  close() {
    this.connection.close();
  }
}
