import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventStoreBus } from './event-store.bus';
import { EventStore } from '../event-store.class';
import { EventStoreModule } from '../event-store.module';
import {
  EventStoreModuleAsyncOptions,
  EventStorePublisher,
  IEventStoreBusConfig,
  IEventStoreConfig,
} from '..';

@Global()
@Module({})
export class EventStoreCqrsModule extends CqrsModule {
  static register(
    eventStoreConfig: IEventStoreConfig,
    eventStoreBusConfig: IEventStoreBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [
        CqrsModule,
        EventBus,
        EventStoreModule.register(eventStoreConfig),
      ],
      providers: [
        CommandBus,
        QueryBus,
        EventStorePublisher,
        {
          provide: EventStoreBus,
          useFactory: async (commandBus, eventStore, eventBus) => {
            return new EventStoreBus(eventStore, eventStoreBusConfig, eventBus);
          },
          inject: [CommandBus, EventStore, EventBus],
        },
      ],
      exports: [
        EventStoreModule,
        EventStorePublisher,
        CommandBus,
        QueryBus,
        EventBus,
      ],
    };
  }
  static registerAsync(
    eventStoreConfigFactory: EventStoreModuleAsyncOptions,
    eventStoreBusConfig: IEventStoreBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [
        CqrsModule,
        EventBus,
        EventStoreModule.registerAsync(eventStoreConfigFactory),
      ],
      providers: [
        CommandBus,
        QueryBus,
        EventStorePublisher,
        {
          provide: EventStoreBus,
          useFactory: async (commandBus, eventStore, eventBus) => {
            return new EventStoreBus(eventStore, eventStoreBusConfig, eventBus);
          },
          inject: [CommandBus, EventStore, EventBus],
        },
      ],
      exports: [
        EventStoreModule,
        EventStorePublisher,
        CommandBus,
        QueryBus,
        EventBus,
      ],
    };
  }
}
