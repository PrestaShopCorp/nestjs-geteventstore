import { defer, EMPTY, from, interval, merge, of, Subject } from 'rxjs';
import {
  catchError,
  concatAll,
  filter,
  map,
  mergeMapTo,
  tap,
  timeout,
  toArray,
} from 'rxjs/operators';
import * as fp from 'lodash/fp';
import * as uuid from 'uuid';
import { EventStore } from '../event-store.class';
import { Injectable, Logger } from '@nestjs/common';
import { WrongExpectedVersionError } from 'node-eventstore-client';

@Injectable()
export class EventStoreObserver {
  writeTimeout: number;
  retryInProgress: boolean;
  retryBuffer: any[];
  retryInterval: number;
  _getStreamName: any;
  _incrementRetryCount: any;
  logger = new Logger(this.constructor.name);
  retryTrigger: Subject<unknown>;

  constructor(
    private readonly eventstoreConnector: EventStore,
    writeTimeout = 5000,
    retryInterval = 5000,
  ) {
    this.writeTimeout = writeTimeout;

    this.retryInProgress = false;
    this.retryBuffer = [];

    this.retryInterval = retryInterval;

    this._getStreamName = fp.get('eventStreamId');

    this._incrementRetryCount = fp.update(
      ['metadata', 'writeEventRetry'],
      v => (v || 0) + 1,
    );

    this.retryTrigger = new Subject();

    this.initAutoRetry();
  }

  next(event) {
    if (!event || !event.eventStreamId) {
      return;
    }
    this.writeEvent(event.eventStreamId, event);
  }

  error(err) {
    if (!err || !err.eventStreamId) {
      return;
    }
    // console.error('EventstoreObserver:onError', err)
    this.writeEvent(err.eventStreamId, err);
  }

  writeEvent(stream, event) {
    /**
     * add default eventId if missing. It will allow us to send the event multiple time
     * without risking to duplicate it.
     */
    const eventWithId = this.addDefaultId(event);
    /**
     *  If the retry buffer is not empty, it means that the eventstore is in trouble.
     *  In this case, we queue the event in the buffer to send it later.
     * It will prevent from calling
     *  ES too much times and will help to maintain events in the right order.
     */
    if (this.retryInProgress || this.retryBuffer.length > 0) {
      this.addToRetryBuffer(eventWithId, false);
      return;
    }

    this.eventstoreConnector
      .writeEvents(eventWithId.eventStreamId, eventWithId)
      .pipe(timeout(this.writeTimeout))
      .subscribe(
        null,
        err => {
          if (this.isRetryable(err)) {
            this.addToRetryBuffer(eventWithId, true);
          } else {
            // TODO: Send it to sentry ?
          }
        },
        null,
      );
  }

  initAutoRetry() {
    merge(interval(this.retryInterval), this.retryTrigger)
      .pipe(
        filter(() => !this.retryInProgress),
        filter(() => this.retryBuffer.length > 0),
      )
      .subscribe(
        () => this.retry(),
        () => {},
        () => {},
      );
  }

  private retry() {
    // This is not very atomic :astonished: :nuclear:
    this.retryInProgress = true;
    const buffer = fp.take(100)(this.retryBuffer);
    this.retryBuffer = fp.drop(100)(this.retryBuffer);

    let errorReceived = false;

    from(buffer)
      .pipe(
        map(event => {
          // This map returns an observable because we will use it with a concatAll()
          return defer(() => {
            // If an error occurred in the batch, we don't want to call the eventstore again,
            // we want to re-queue events in the buffer and wait for the next retry call.
            if (errorReceived) {
              return of(event);
            }

            const stream = this._getStreamName(event);

            // Try to write events in eventstore...
            return this.eventstoreConnector.writeEvents(stream, [event]).pipe(
              // ...with a timeout
              timeout(this.writeTimeout),
              // On success, we empty the returned observable because we dont want to
              // requeue events in the buffer
              mergeMapTo(EMPTY),
              // On error, we want to requeue the event in the buffer and avoid the next
              // events to be written in the eventstore.
              tap(
                null,
                err => {
                  console.log(
                    `Unable to persist event to eventstore in stream ${stream} : ${JSON.stringify(
                      event,
                    )}`,
                    err,
                  );
                },
                null,
              ),
              catchError(err => {
                if (this.isRetryable(err)) {
                  errorReceived = true;
                  return of(event);
                }
                console.log(
                  `Dropping event because its invalid : ${JSON.stringify(
                    event,
                  )}`,
                );
                return EMPTY;
              }),
            );
          });
        }),
        // Execute all previously defined commands sequentially, one by one
        concatAll(),
        // At this point, the observable contains only events not written in the eventstore.
        // Increment the retry count in the event metadata
        map(this._incrementRetryCount),
        // Re-combine events to a single array
        toArray(),
      )
      .subscribe(
        events => {
          // prepend events to the buffer
          if (events.length > 0) {
            this.retryBuffer = fp.concat(events, this.retryBuffer);
            this.retryInProgress = false;
            return;
          }
          // If there was no error (no events to put back into the buffer) and that
          // some events are waiting in the buffer, trigger immediatly a retry to dequeue
          // waiting events as soon as possible
          this.retryInProgress = false;
          this.retryTrigger.next(true);
        },
        err => {
          console.log('Unexpected error in eventstore retry'); // <-- should not happen !
          console.log(`ERROR: ${err.message || err}`);
          this.retryInProgress = false;
        },
        null,
      );
  }

  private isRetryable(err) {
    // TODO handle tcp
    this.logger.debug(`Write error ${err.message}`);
    switch (err.constructor) {
      case WrongExpectedVersionError:
        this.logger.debug(`Error ${err.constructor} don't retry`);
        return false;
      default:
        this.logger.warn(`Retry error ${err.constructor}`);
        return true;
    }
    const errCode = fp.getOr(200, 'response.status', err);
    return errCode !== 400;
  }

  private addToRetryBuffer(event, incrementRetryCount = false) {
    this.retryBuffer.push(
      incrementRetryCount ? this._incrementRetryCount(event) : event,
    );
  }

  private addDefaultId(event) {
    if (event.id) {
      return event;
    }
    return fp.defaults({ id: uuid.v4() })(event);
  }
}
