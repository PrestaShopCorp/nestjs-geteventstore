import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { EventStoreModule } from './event-store.module';
import {
  IEventBusConfig,
  IEventStoreAsyncConfig,
  IEventStoreConfig,
} from './interfaces';
import { ReadEventBus, WriteEventBus } from './cqrs';
import { EventStore } from './event-store';

const commonRegister = (eventBusConfig: IEventBusConfig) => {
  return {
    providers: [
      {
        provide: WriteEventBus,
        useFactory: async (
          commandBus: CommandBus,
          moduleRef: ModuleRef,
          eventStore: EventStore,
        ) =>
          new WriteEventBus(commandBus, moduleRef, eventStore, eventBusConfig),
        inject: [CommandBus, ModuleRef, EventStore],
      },
      {
        provide: ReadEventBus,
        useFactory: async (commandBus: CommandBus, moduleRef: ModuleRef) =>
          new ReadEventBus(commandBus, moduleRef, eventBusConfig),
        inject: [CommandBus, ModuleRef],
      },
    ],
    exports: [EventStoreModule, ReadEventBus, WriteEventBus],
  };
};

@Module({
  imports: [CqrsModule],
})
export class EventStoreCqrsModule {
  static register(
    eventStoreConfig: IEventStoreConfig,
    eventBusConfig: IEventBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [EventStoreModule.register(eventStoreConfig)],
      ...commonRegister(eventBusConfig),
    };
  }
  static registerAsync(
    eventStoreConfigFactory: IEventStoreAsyncConfig,
    eventBusConfig: IEventBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [EventStoreModule.registerAsync(eventStoreConfigFactory)],
      ...commonRegister(eventBusConfig),
    };
  }
}
