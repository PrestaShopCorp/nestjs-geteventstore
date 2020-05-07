import { Global, Module, Provider } from '@nestjs/common';
import { EventStoreObserver } from './event-store.observer';
import { EventStore } from '../event-store.class';

@Global()
@Module({})
export class EventStoreObserverModule {
  public static register() {
    const provider: Provider = {
      provide: EventStoreObserver,
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
