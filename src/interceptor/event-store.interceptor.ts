import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { EventStoreObserver } from '../observer/event-store.observer';
import { EVENT_STORE_OBSERVER_TOKEN } from '../interfaces/constants';
import * as express from 'express';
import { filter, map } from 'rxjs/operators';
import { EventStoreEvent } from '..';

@Injectable()
export class EventStoreInterceptor implements NestInterceptor {
  constructor(
    @Inject(EVENT_STORE_OBSERVER_TOKEN)
    private readonly eventStoreOberver: EventStoreObserver,
  ) {
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Extract correlation from request
    const req: express.Request = context.switchToHttp().getRequest();
    const correlationId = req.header('x-correlation-eventId');

    // Build router to send data to next and Eventstore
    const handlerSubject$ = new Subject();

    // Add correlation eventId to the event
    // only if return is an event
    handlerSubject$
      .pipe(
        filter(req => {
          return req instanceof EventStoreEvent;
        }),
        map((ev: EventStoreEvent) => {
          if (correlationId) {
            ev.metadata['correlation_id'] = correlationId;
          }
          return ev;
        }),
      )
      .subscribe(this.eventStoreOberver);

    // Run next step and send it to everyone
    next.handle().subscribe(handlerSubject$);

    // return next result
    return handlerSubject$;
  }
}
