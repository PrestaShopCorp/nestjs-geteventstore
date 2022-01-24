import { DynamicModule, Module } from '@nestjs/common';
import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';
import { ContextName } from 'nestjs-context';
import { WriteEventsPrepublishService } from './cloudevents';
import { READ_EVENT_BUS_CONFIG, WRITE_EVENT_BUS_CONFIG } from './constants';
import { ReadEventBus, WriteEventBus } from './cqrs';
import { EventBusPrepublishService } from './cqrs/event-bus-prepublish.service';
import { IEventStoreSubsystems } from './event-store/config';
import { EventStoreConnectionConfig } from './event-store/config/event-store-connection-config';
import { EventStoreModule } from './event-store/event-store.module';
import {
  EventBusConfigType,
  IPersistentSubscriptionConfig,
  IWriteEventBusConfig,
  ReadEventBusConfigType,
} from './interfaces';

const getDefaultEventBusConfiguration: IWriteEventBusConfig = {
  context: ContextName.HTTP,
  validate: WriteEventsPrepublishService,
  prepare: WriteEventsPrepublishService,
};

@Module({
  providers: [
    WriteEventsPrepublishService,
    EventBusPrepublishService,
    ExplorerService,
    WriteEventBus,
    ReadEventBus,
    CommandBus,
    QueryBus,
    { provide: EventBus, useExisting: ReadEventBus },
  ],
  exports: [
    WriteEventsPrepublishService,
    EventBusPrepublishService,
    ExplorerService,
    WriteEventBus,
    ReadEventBus,
    CommandBus,
    QueryBus,
    EventBus,
  ],
})
export class CqrsEventStoreModule extends CqrsModule {
  static register(
    eventStoreConfig: EventStoreConnectionConfig,
    eventStoreSubsystems: IEventStoreSubsystems = {
      onConnectionFail: (e) => console.log('e : ', e),
    },
    eventBusConfig: EventBusConfigType = {},
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [
        EventStoreModule.register(eventStoreConfig, eventStoreSubsystems),
      ],
      providers: [
        { provide: READ_EVENT_BUS_CONFIG, useValue: eventBusConfig.read },
        {
          provide: WRITE_EVENT_BUS_CONFIG,
          useValue: { ...getDefaultEventBusConfiguration, ...eventBusConfig },
        },
      ],
      exports: [EventStoreModule],
    };
  }

  static registerReadBus(
    eventStoreConfig: EventStoreConnectionConfig,
    eventBusConfig: ReadEventBusConfigType,
    subscriptions: IPersistentSubscriptionConfig[] = [],
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [
        EventStoreModule.register(eventStoreConfig, {
          subscriptions: { persistent: subscriptions },
          onConnectionFail: (e) => console.log('e : ', e),
        }),
      ],
      providers: [
        { provide: READ_EVENT_BUS_CONFIG, useValue: eventBusConfig },
        { provide: EventBus, useExisting: ReadEventBus },
      ],
      exports: [EventStoreModule],
    };
  }

  static registerWriteBus(
    eventStoreConfig: EventStoreConnectionConfig,
    eventBusConfig: IWriteEventBusConfig = {},
  ): DynamicModule {
    return {
      module: CqrsEventStoreModule,
      imports: [EventStoreModule.register(eventStoreConfig)],
      providers: [
        {
          provide: WRITE_EVENT_BUS_CONFIG,
          useValue: { ...getDefaultEventBusConfiguration, ...eventBusConfig },
        },
      ],
      exports: [EventStoreModule],
    };
  }
}
