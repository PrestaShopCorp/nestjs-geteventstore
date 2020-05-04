import { CommandBus, CqrsModule, EventBus, IEvent, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventStoreBus } from './event-store.bus';
import { EventStore } from './event-store.class';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';
import { EventStoreModule, EventStoreModuleAsyncOptions } from './event-store.module';
import { EventStoreObserver } from './event-store.observer';
import { EventStoreBusConfig } from '../..';
import { Subject } from 'rxjs';
import { ModuleRef } from '@nestjs/core';

@Global()
@Module({})
export class EventStoreCqrsModule extends CqrsModule {
  static forRootAsync(
    options: EventStoreModuleAsyncOptions,
    eventStoreBusConfig: EventStoreBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [CqrsModule, EventStoreModule.forRootAsync(options)],
      providers: [
        {
          provide: EventBus,
          useFactory: (commandBus, eventStore, moduleRef, eventBus) => {
            // @ts-ignore
            return new EventStoreBus(
              eventStore,
              new Subject<IEvent>(),
              eventStoreBusConfig,
              eventBus
            );
          },
          inject: [CommandBus, EventStore, ModuleRef, EventBus],
        },
        {
          provide: EventStoreObserver,
          useFactory: eventStore => {
            return new EventStoreObserver(eventStore);
          },
          inject: [EventStore],
        },
      ],
      exports: [
        EventStoreModule,
        EventBus,
        CommandBus,
        QueryBus,
        EventStoreObserver,
      ],
    };
  }
}
