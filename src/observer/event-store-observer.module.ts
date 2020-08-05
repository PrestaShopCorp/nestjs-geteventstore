import { Global, Module } from '@nestjs/common';
import { EventStoreObserver } from './event-store.observer';
import { EventStore } from '../event-store.class';

@Global()
@Module({})
export class EventStoreObserverModule {
  public static register() {
    return {
      exports: [EventStoreObserver],
      module: EventStoreObserverModule,
      providers: [{
        provide: EventStoreObserver,
        useFactory: (es: EventStore) => {
          return new EventStoreObserver(es);
        },
        inject: [EventStore],
      }],
    };
  }
}
