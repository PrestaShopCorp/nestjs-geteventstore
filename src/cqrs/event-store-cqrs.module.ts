import { CommandBus, CqrsModule, EventBus, IEvent, QueryBus } from '@nestjs/cqrs';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventStoreBus } from './event-store.bus';
import { EventStore } from '../event-store.class';
import { EventStoreModule } from '../event-store.module';
import { EventStoreObserver, IEventStoreConfig } from '..';
import { IEventStoreBusConfig } from '..';
import { Subject } from 'rxjs';
import { EventStorePublisher } from './event-store.publisher';

@Global()
@Module({})
export class EventStoreCqrsModule extends CqrsModule {
  static registerAsync(
    eventStoreConfig: IEventStoreConfig,
    eventStoreBusConfig: IEventStoreBusConfig,
  ): DynamicModule {
    return {
      module: EventStoreCqrsModule,
      imports: [CqrsModule, EventBus, EventStoreModule.register(eventStoreConfig)],
      providers: [
        CommandBus,
        QueryBus,
        EventStoreBus,
        {
          provide: EventStoreBus,
          useFactory: async (commandBus, eventStore, eventBus) => {
            // @ts-ignore
            const bus = new EventStoreBus(
              eventStore,
              new Subject<IEvent>(),
              eventStoreBusConfig,
              eventBus
            );
            return bus.connect();
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
