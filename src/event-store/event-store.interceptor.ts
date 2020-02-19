import {
  NestInterceptor,
  Injectable,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { EventStoreObserver } from './event-store.observer';
import { EVENT_STORE_OBSERVER_TOKEN } from './shared/constants';

@Injectable()
export class EventStoreInterceptor implements NestInterceptor {
  constructor(
    @Inject(EVENT_STORE_OBSERVER_TOKEN)
    private readonly eventStoreOberver: EventStoreObserver,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handlerSubject$ = new Subject();
    next.handle().subscribe(handlerSubject$);
    handlerSubject$.subscribe(this.eventStoreOberver);
    return handlerSubject$;
  }
}
