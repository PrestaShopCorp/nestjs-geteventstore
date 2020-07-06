import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { EventStore } from './event-store.class';
import {
  EventStoreModuleAsyncOptions,
  IEventStoreConfig,
} from './interfaces/event-store-config.interface';
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
      imports: [],
      providers: [
        {
          provide: EventStore,
          useFactory: logger => {
            return new EventStore(config, logger);
          },
          inject: [Logger],
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

  static registerAsync(options: EventStoreModuleAsyncOptions): DynamicModule {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EventStore,
          useFactory: async (configService, logger) => {
            const config: IEventStoreConfig = await options.useFactory(
              configService,
            );
            return new EventStore(config, logger);
          },
          inject: [...options.inject, Logger],
        },
      ],
      exports: [EventStoreModule],
    };
  }
}
