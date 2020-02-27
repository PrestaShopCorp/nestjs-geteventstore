import { createConnection, EventStoreNodeConnection, expectedVersion, TcpEndPoint } from 'node-eventstore-client';
import * as geteventstorePromise from 'geteventstore-promise';
import { HTTPClient } from 'geteventstore-promise';
import { defer, from, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import * as fp from 'lodash/fp';
import { catchError, flatMap, map, toArray } from 'rxjs/operators';

export class EventStore {
  connection: EventStoreNodeConnection;
  expectedVersion: any;
  isConnected: boolean = false;
  HTTPClient: HTTPClient;

  private logger: Logger = new Logger(this.constructor.name);
  _addDefaultVersion: any;
  _toEventstoreEvent: (e: any) => any;

  constructor(
    private credentials,
    private TCPEndpoint: TcpEndPoint,
    private HTTPEndpoint: any,
  ) {
    this.connect();
    this.HTTPClient = new geteventstorePromise.HTTPClient({
      hostname: this.HTTPEndpoint.host,
      port: this.HTTPEndpoint.port,
      credentials: {
        username: this.credentials.username,
        password: this.credentials.password,
      },
    });
    this.expectedVersion = expectedVersion;
    this._addDefaultVersion = fp.merge({ metadata: { version: 1 } });
    this._toEventstoreEvent = e =>
      new geteventstorePromise.EventFactory().newEvent(
        e.type,
        e.data,
        e.metadata,
        e.id,
      );
  }

  async connect() {
    this.connection = createConnection(
      { defaultUserCredentials: this.credentials },
      this.TCPEndpoint,
    );
    this.connection.connect();
    this.connection.on('connected', () => {
      this.logger.log('Connection to EventStore established!');
      this.isConnected = true;
    });
    this.connection.on('closed', () => {
      this.logger.error('Connection to EventStore closed!');
      this.isConnected = false;
      this.connect();
    });
  }

  writeEvents(stream, ...events) {
    return defer(() => {
      return from(events).pipe(
        map(this._addDefaultVersion),
        // tap(console.log),
        map(this._toEventstoreEvent),
        // If the event is invalid (if _toEventstoreEvent throw an exception), return a 400 error
        catchError(err => {
          return throwError({
            message: `Unable to convert event to Eventstore event : ${err.message}`,
            response: { status: 400 },
          });
        }),
        toArray(),
        flatMap(esEvents =>
          from(this.HTTPClient.writeEvents(stream, esEvents)),
        ),
      );
    });
  }

  close() {
    this.connection.close();
  }
}
