import { Global, Module, DynamicModule } from '@nestjs/common';
import { EventStore } from './event-store.class';
import { ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
import { EventStoreObserverModule } from './event-store-observer.module';
import { EventStoreCoreModule } from './event-store-core.module';

export interface EventStoreModuleOptions {
  connectionSettings: ConnectionSettings;
  endpoint: TcpEndPoint;
}

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
            const { connectionSettings, TCP, HTTP } = await options.useFactory(
              ...args,
            );
            return new EventStore(connectionSettings, TCP, HTTP);
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
