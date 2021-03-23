import { DynamicModule, Module } from '@nestjs/common';
import { EventStore, EventStoreHealthIndicator, EventStoreSubscriptionHealthIndicator } from './event-store';
import { IEventStoreAsyncConfig, IEventStoreConfig } from './interfaces';

const commonProvidersAndExports = {
  providers: [EventStoreHealthIndicator, EventStoreSubscriptionHealthIndicator],
  exports: [
    EventStore,
    EventStoreHealthIndicator,
    EventStoreSubscriptionHealthIndicator,
  ],
};

@Module({
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {
  static register(config: IEventStoreConfig) {
    return {
      module: EventStoreModule,
      ...commonProvidersAndExports,
      providers: [
        {
          provide: EventStore,
          useValue: new EventStore(config),
        },
        ...commonProvidersAndExports.providers,
      ],
    };
  }
  static registerAsync(options: IEventStoreAsyncConfig): DynamicModule {
    return {
      module: EventStoreModule,
      ...commonProvidersAndExports,
      providers: [
        {
          provide: EventStore,
          useFactory: async (configService) => {
            const config: IEventStoreConfig = await options.useFactory(
              configService,
            );
            return new EventStore(config);
          },
          inject: [...options.inject],
        },
        ...commonProvidersAndExports.providers,
      ],
    };
  }
}
