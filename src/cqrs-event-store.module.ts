import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Module } from '@nestjs/common';

import { EventStoreModule } from './event-store.module';
import {
  EventBusConfigType,
  IEventStoreModuleAsyncConfig,
  IEventStoreConfig,
  IEventStoreServiceConfig,
} from './interfaces';
import { ReadEventBus, WriteEventBus } from './cqrs';
import {
  EVENT_STORE_SERVICE_CONFIG,
  READ_EVENT_BUS_CONFIG,
  WRITE_EVENT_BUS_CONFIG,
} from './constants';
import { EventStoreService } from './event-store';
import { EventBusPrepublishService } from './cqrs/event-bus-prepublish.service';

const commonRegister = (
  cqrsEventStoreConfig: EventBusConfigType,
  eventStoreServiceConfig: IEventStoreServiceConfig,
) => {
  return {
    providers: [
      CommandBus,
      QueryBus,
      {
        provide: WRITE_EVENT_BUS_CONFIG,
        useValue: cqrsEventStoreConfig.write || {},
      },
      {
        provide: READ_EVENT_BUS_CONFIG,
        useValue: cqrsEventStoreConfig.read || {},
      },
      {
        provide: EVENT_STORE_SERVICE_CONFIG,
        useValue: eventStoreServiceConfig,
      },
      WriteEventBus,
      ReadEventBus,
      EventStoreService,
      EventBusPrepublishService,
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
    eventBusConfig: EventBusConfigType = {},
    eventStoreServiceConfig: IEventStoreServiceConfig = {},
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [EventStoreModule.register(eventStoreConfig)],
      ...commonRegister(eventBusConfig, eventStoreServiceConfig),
    };
  }
  static registerAsync(
    eventStoreConfigFactory: IEventStoreModuleAsyncConfig,
    eventBusConfig: EventBusConfigType = {},
    eventStoreServiceConfig: IEventStoreServiceConfig = {},
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [EventStoreModule.registerAsync(eventStoreConfigFactory)],
      ...commonRegister(eventBusConfig, eventStoreServiceConfig),
    };
  }
}
