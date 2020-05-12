import {
  createConnection,
  createJsonEventData,
  EventStoreNodeConnection,
} from 'node-eventstore-client';
import * as geteventstorePromise from 'geteventstore-promise';
import { HTTPClient } from 'geteventstore-promise';
import { from, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import { catchError, flatMap, map, toArray } from 'rxjs/operators';
import { ExpectedVersion } from './interfaces/event.interface';
import { IEvent } from '@nestjs/cqrs';
import { IEventStoreConfig } from './interfaces/event-store-config.interface';
import { v4 } from 'uuid';

// FIXME still needed ?
export class EventStore {
  public connection: EventStoreNodeConnection;
  public readonly HTTPClient: HTTPClient;
  public isConnected: boolean = false;
  private logger: Logger = new Logger(this.constructor.name);

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
      this.logger.error('Connection to EventStore closed!');
      this.config.onTcpDisconnected(this);
    });
  }

  writeEvents(stream, events: IEvent[], expectedVersion = ExpectedVersion.Any) {
    return from(events)
      .pipe(
        map(event =>
          createJsonEventData(
            event['eventId'] || v4(),
            event['data'] || {},
            event['metadata'] || { version: 1, created_at: new Date() },
            event['eventType'] || event.constructor.name,
          ),
        ),
        catchError(err => {
          return throwError({
            message: `Unable to convert event to EventStore event : ${err.message}`,
            response: { status: 400 },
          });
        }),
        toArray(),
      )
      .pipe(
        //tap(esEvents => console.log('Writing events', stream, esEvents)),
        flatMap(esEvents =>
          from(
            this.connection.appendToStream(stream, expectedVersion, esEvents),
          ),
        ),
        catchError(err => {
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
}
