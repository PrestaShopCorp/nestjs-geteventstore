import {
  CommandBus,
  CqrsModule,
  EventBus,
  IEvent,
  QueryBus,
} from '@nestjs/cqrs';
import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { EventStoreBus } from './event-store.bus';
import { EventStore } from '../event-store.class';
import { EventStoreModule } from '../event-store.module';
import { IEventStoreBusConfig, IEventStoreConfig } from '..';
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
      imports: [
        CqrsModule,
        EventBus,
        EventStoreModule.register(eventStoreConfig),
      ],
      providers: [
        CommandBus,
        QueryBus,
        { provide: Logger, useValue: new Logger('EventStoreCqrs') },
        EventStoreBus,
        {
          provide: EventStoreBus,
          useFactory: async (commandBus, eventStore, eventBus, logger) => {
            return new EventStoreBus(
              eventStore,
              new Subject<IEvent>(),
              eventStoreBusConfig,
              eventBus,
              logger,
            );
          },
          inject: [CommandBus, EventStore, EventBus, Logger],
        },
        {
          provide: EventStorePublisher,
          useFactory: (eventBus, eventStore, logger) => {
            return new EventStorePublisher(eventBus, eventStore, logger);
          },
          inject: [EventStoreBus, EventStore, Logger],
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
