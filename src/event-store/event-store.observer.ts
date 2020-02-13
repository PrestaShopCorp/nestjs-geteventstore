import { interval, from, EMPTY, defer, of, Subject, merge } from 'rxjs';
import {
  timeout,
  map,
  concatAll,
  mergeMapTo,
  catchError,
  filter,
  tap,
  toArray,
} from 'rxjs/operators';
import fp from 'lodash/fp';
import uuid from 'uuid';
import { EventStore } from './event-store.class';

export class EventStoreObserver {
  writeTimeout: number;
  retryInProgress: boolean;
  retryBuffer: any[];
  retryInterval: number;
  _getStreamName: any;
  _incrementRetryCount: any;
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

    this._getStreamName = fp.get('stream');

    this._incrementRetryCount = fp.update(
      ['meta', 'writeEventRetry'],
      v => (v || 0) + 1,
    );

    this.retryTrigger = new Subject();

    this.initAutoRetry();
  }

  next(event) {}

  error(err) {
    if (!err || !err.stream) {
      return;
    }
    // console.error('EventstoreObserver:onError', err)
    this.writeEvent(err.stream, err);
  }

  writeEvent(stream, event) {
    /**
     * add default id if missing. It will allow us to send the event multiple time
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
      .writeEvents(eventWithId.stream, eventWithId)
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

  initAutoRetry() {}

  private isRetryable(err) {
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
