import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import ESEventBus from './es-event-bus';
import ESEvent from './es-event';
import EsSubsystemConfiguration from './es-subsystems/es-subsystem.configuration';
import { Client } from '@eventstore/db-client/dist/Client';
import { EventStoreDBClient } from '@eventstore/db-client';
import { EVENT_STORE_CONNECTOR, EVENT_STORE_SUBSYSTEMS } from './es.constant';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';

@Module({
  imports: [CqrsModule],
  providers: [ESEventBus, CommandBus, QueryBus, ExplorerService],
  exports: [ESEventBus, EVENT_STORE_CONNECTOR, CommandBus, QueryBus],
})
export default class EventStoreCqrsModule<EventBase extends ESEvent = ESEvent>
  implements OnModuleInit
{
  constructor(
    private readonly explorerService: ExplorerService<EventBase>,
    private readonly eventBus: ESEventBus<EventBase>,
    private readonly commandsBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  public async onModuleInit(): Promise<void> {
    const { events, queries, commands } = this.explorerService.explore();

    await this.eventBus.register(events);
    await this.commandsBus.register(commands);
    await this.queryBus.register(queries);
  }

  public static async connect(
    connectionString: string,
    esConfig: EsSubsystemConfiguration,
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
      ],
    };
  }
}
