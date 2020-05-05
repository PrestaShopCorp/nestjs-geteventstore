import { Global, Module, DynamicModule } from '@nestjs/common';
import { EventStore } from './event-store.class';
import { EventStoreObserverModule } from './observer/event-store-observer.module';
import { EventStoreCoreModule } from './event-store-core.module';

export interface EventStoreModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<any> | any;
  inject?: any[];
}

@Global()
@Module({
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {
  static forRootAsync(options: EventStoreModuleAsyncOptions): DynamicModule {
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
        EventStoreCoreModule,
        EventStoreObserverModule,
      ],
      exports: [EventStore, EventStoreObserverModule],
      imports: [EventStoreObserverModule.forRootAsync(EventStore)],
    };
  }
}