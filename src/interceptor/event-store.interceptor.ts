import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { EventStore, EventStoreEvent } from '..';
import * as express from 'express';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class EventStoreInterceptor implements NestInterceptor {
  constructor(private readonly eventStore: EventStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Extract correlation from request
    const req: express.Request = context.switchToHttp().getRequest();
    const correlationId = req.header('x-correlation-eventId');

    // to send data on next and Eventstore
    const handlerSubject$ = new Subject();

    // Add correlation eventId to the event
    // only if return is an event
    handlerSubject$
      .pipe(
        filter((req) => {
          return req instanceof EventStoreEvent;
        }),
        map((ev: EventStoreEvent) => {
          if (correlationId) {
            ev.metadata['correlation_id'] = correlationId;
          }
          return ev;
        }),
      )
      .subscribe((ev) => {
        this.eventStore.writeEvents(ev.eventStreamId, [ev]);
      });

    // Run next step and send it to everyone
    next.handle().subscribe(handlerSubject$);

    // return next result
    return handlerSubject$;
  }
}
