import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Module } from '@nestjs/common';

import { EventStoreModule } from './event-store.module';
import {
  CqrsEventStoreConfigType,
  IEventStoreModuleAsyncConfig,
  IEventStoreConfig,
} from './interfaces';
import { ReadEventBus, WriteEventBus } from './cqrs';
import { CQRS_EVENT_STORE_CONFIG } from './constants';
import { EventStoreService } from './event-store';

const commonRegister = (cqrsEventStoreConfig: CqrsEventStoreConfigType) => {
  return {
    providers: [
      CommandBus,
      QueryBus,
      {
        provide: CQRS_EVENT_STORE_CONFIG,
        useValue: cqrsEventStoreConfig,
      },
      WriteEventBus,
      ReadEventBus,
      EventStoreService,
      {
        provide: EventBus,
        useExisting: ReadEventBus,
      },
    ],
    exports: [
      CommandBus,
      QueryBus,
      EventStoreModule,
      ReadEventBus,
      WriteEventBus,
    ],
  };
};

@Module({})
export class CqrsEventStoreModule extends CqrsModule {
  static register(
    eventStoreConfig: IEventStoreConfig,
    cqrsEventStoreConfig: CqrsEventStoreConfigType,
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [EventStoreModule.register(eventStoreConfig)],
      ...commonRegister(cqrsEventStoreConfig),
    };
  }
  static registerAsync(
    eventStoreConfigFactory: IEventStoreModuleAsyncConfig,
    cqrsEventStoreConfig: CqrsEventStoreConfigType,
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [EventStoreModule.registerAsync(eventStoreConfigFactory)],
      ...commonRegister(cqrsEventStoreConfig),
    };
  }
}
