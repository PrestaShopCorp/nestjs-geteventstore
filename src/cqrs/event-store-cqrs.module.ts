import { CommandBus, CqrsModule, EventBus, IEvent, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventStoreBus } from './event-store.bus';
import { EventStore } from '../event-store.class';
import { EventStoreModule, EventStoreModuleAsyncOptions } from '../event-store.module';
import { EventStoreObserver } from '..';
import { IEventStoreBusConfig } from '..';
import { Subject } from 'rxjs';
import { EventStorePublisher } from './event-store.publisher';

@Global()
@Module({})
export class EventStoreCqrsModule extends CqrsModule {
  static forRootAsync(
    options: EventStoreModuleAsyncOptions,
    eventStoreBusConfig: IEventStoreBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [CqrsModule, EventBus, EventStoreModule.forRootAsync(options)],
      providers: [
        CommandBus,
        QueryBus,
        EventStoreBus,
        {
          provide: EventStoreBus,
          useFactory: (commandBus, eventStore, eventBus) => {
            // @ts-ignore
            return new EventStoreBus(
              eventStore,
              new Subject<IEvent>(),
              eventStoreBusConfig,
              eventBus
            );
          },
          inject: [CommandBus, EventStore, EventBus],
        },
        {
          provide: EventStoreObserver,
          useFactory: eventStore => {
            return new EventStoreObserver(eventStore);
          },
          inject: [EventStore],
        },
        {
          provide: EventStorePublisher,
          useFactory: (eventBus, eventStore) => {
            return new EventStorePublisher(eventBus, eventStore);
          },
          inject: [EventStoreBus, EventStore],
        },
      ],
      exports: [
        EventStoreModule,
        EventStorePublisher,
        EventStoreObserver,
        CommandBus,
        QueryBus,
        EventBus,
      ],
    };
  }
}
