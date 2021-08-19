import { DynamicModule, Module, OnModuleInit, Type } from '@nestjs/common';
import { CommandBus, CqrsModule, IEventHandler, QueryBus } from '@nestjs/cqrs';
import ESEventBus from './es-event-bus';
import ESEvent from './es-event';
import EsSubsystemConfiguration from './es-subsystems/es-subsystem.configuration';
import { Client } from '@eventstore/db-client/dist/Client';
import { EventStoreDBClient } from '@eventstore/db-client';
import {
  EVENT_STORE_CONNECTOR,
  EVENT_STORE_EVENTS_HANDLERS,
  EVENT_STORE_SUBSYSTEMS,
} from './es.constant';

@Module({
  imports: [CqrsModule],
  providers: [ESEventBus, CommandBus, QueryBus],
  exports: [ESEventBus, EVENT_STORE_CONNECTOR, CommandBus, QueryBus],
})
export default class EventStoreCqrsModule<EventBase extends ESEvent = ESEvent>
  implements OnModuleInit
{
  constructor(private readonly eventBus: ESEventBus<EventBase>) {}

  public async onModuleInit(): Promise<void> {
    await this.eventBus.init();
  }

  public static async connect(
    connectionString: string,
    esConfig: EsSubsystemConfiguration,
    eventHandlers: Type<IEventHandler>[],
  ): Promise<DynamicModule> {
    const eventStoreConnector: Client =
      EventStoreDBClient.connectionString(connectionString);
    return {
      module: EventStoreCqrsModule,
      providers: [
        {
          provide: EVENT_STORE_CONNECTOR,
          useValue: eventStoreConnector,
        },
        {
          provide: EVENT_STORE_SUBSYSTEMS,
          useValue: esConfig,
        },
        {
          provide: EVENT_STORE_EVENTS_HANDLERS,
          useValue: eventHandlers,
        },
      ],
    };
  }
}
