import { Global, Module, DynamicModule } from '@nestjs/common';
import { EventStoreModule } from './event-store.module';
import { EventStore } from './event-store.class';
import { EventStoreObserverModule } from './event-store-observer.module';

export interface EventStoreModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<any> | any;
  inject?: any[];
}

@Module({
  providers: [EventStoreCoreModule],
  exports: [EventStoreCoreModule],
})
export class EventStoreCoreModule {
  static forRootAsync(options: EventStoreModuleAsyncOptions): DynamicModule {
    return {
      module: EventStoreCoreModule,
      providers: [
        {
          provide: EventStore,
          useFactory: async (...args) => {
            const {
              connectionSettings,
              endpoint,
              HTTPEndpoint,
            } = await options.useFactory(...args);
            return new EventStore(connectionSettings, endpoint, HTTPEndpoint);
          },
          inject: options.inject,
        },
        EventStore,
      ],
      exports: [EventStore],
    };
  }
}
