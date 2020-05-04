import { Global, Module, DynamicModule } from '@nestjs/common';
import { EventStore } from './event-store.class';
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
  static register(options: EventStoreModuleAsyncOptions): DynamicModule {
    return {
      module: EventStoreModule,
      imports: [EventStoreCoreModule.forRootAsync(options)],
    };
  }
}
