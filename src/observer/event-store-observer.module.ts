import { Global, Module, DynamicModule, Provider } from '@nestjs/common';
import { EVENT_STORE_OBSERVER_TOKEN } from '../interfaces/constants';
import { EventStoreObserver } from './event-store.observer';
import { EventStore } from '../event-store.class';

@Global()
@Module({})
export class EventStoreObserverModule {
  public static forRootAsync(eventstore): DynamicModule {
    const provider: Provider = {
      provide: EVENT_STORE_OBSERVER_TOKEN,
      useFactory: eventstore => {
        return new EventStoreObserver(eventstore);
      },
      inject: [EventStore],
    };
    return {
      exports: [provider],
      module: EventStoreObserverModule,
      providers: [provider],
    };
  }
}
