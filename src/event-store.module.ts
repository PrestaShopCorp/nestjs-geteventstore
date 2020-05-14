import { Global, Module } from '@nestjs/common';
import { EventStore } from './event-store.class';
//import { EventStoreObserverModule } from './observer/event-store-observer.module';
import { IEventStoreConfig } from './interfaces/event-store-config.interface';
import { EventStoreHealthIndicator } from './health/event-store.health-indicator';
import { EventStoreSubscriptionHealthIndicator } from './health/event-store-subscription.health-indicator';

@Global()
@Module({
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {
  static register(config: IEventStoreConfig) {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EventStore,
          useFactory: () => {
            return new EventStore(config);
          },
        },
        {
          provide: EventStoreHealthIndicator,
          useFactory: eventStore => {
            return new EventStoreHealthIndicator(eventStore);
          },
          inject: [EventStore],
        },
        {
          provide: EventStoreSubscriptionHealthIndicator,
          useFactory: eventStore => {
            return new EventStoreSubscriptionHealthIndicator(eventStore);
          },
          inject: [EventStore],
        },
      ],
      exports: [
        EventStore,
        EventStoreHealthIndicator,
        EventStoreSubscriptionHealthIndicator,
      ],
    };
  }

  /*static forRootAsync(options: EventStoreModuleAsyncOptions): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EventStore,
          useFactory: async (...args) => {
            const { credentials, tcp, http } = await options.useFactory(
              ...args,
            );
            return new EventStore(credentials, tcp, http);
          },
          inject: options.inject,
        },
        EventStoreObserverModule,
      ],
      exports: [EventStore, EventStoreObserverModule],
      imports: [EventStoreObserverModule.forRootAsync(EventStore)],
    };
  }*/
}
