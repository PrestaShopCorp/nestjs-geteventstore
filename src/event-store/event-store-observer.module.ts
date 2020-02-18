import { Global, Module, DynamicModule, Provider } from '@nestjs/common';
import { EVENT_STORE_OBSERVER_TOKEN } from './shared/constants';
import { EventStoreObserver } from './event-store.observer';
import { EventStore } from './event-store.class';

@Global()
@Module({})
export class EventStoreObserverModule {
  public static forRootAsync(): DynamicModule {
    const provider: Provider = {
      inject: [EventStore],
      provide: EVENT_STORE_OBSERVER_TOKEN,
      useFactory: eventstoreConnector => {
        return new EventStoreObserver(eventstoreConnector);
      },
    };

    return {
      exports: [provider],
      module: EventStoreObserverModule,
      providers: [provider],
    };
  }
}
