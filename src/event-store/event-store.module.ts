import { EventStoreDBClient } from '@eventstore/db-client';
import { Client } from '@eventstore/db-client/dist/Client';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EVENT_STORE_SUBSYSTEMS } from '../constants';
import { IEventStoreSubsystems } from './config';
import { EventStoreConnectionConfig } from './config/event-store-connection-config';
import { EventStoreHealthIndicator } from './health';
import { EventStoreService } from './index';
import InMemoryEventsAndMetadatasStacker from './reliability/implementations/in-memory/in-memory-events-and-metadatas-stacker';
import { EVENTS_AND_METADATAS_STACKER } from './reliability/interface/events-and-metadatas-stacker';
import { EVENT_STORE_CONNECTOR } from './services/event-store.constants';
import { EVENT_STORE_SERVICE } from './services/event-store.service.interface';

@Module({
  providers: [
    EventStoreHealthIndicator,
    {
      provide: EVENT_STORE_SERVICE,
      useClass: EventStoreService,
    },
  ],
  exports: [EVENT_STORE_SERVICE, EventStoreHealthIndicator],
})
export class EventStoreModule {
  static async register(
    config: EventStoreConnectionConfig,
    eventStoreSubsystems: IEventStoreSubsystems = {
      onConnectionFail: (e) => console.log('e : ', e),
    },
  ): Promise<DynamicModule> {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENT_STORE_SUBSYSTEMS,
          useValue: eventStoreSubsystems,
        },
        {
          provide: EVENTS_AND_METADATAS_STACKER,
          useClass: InMemoryEventsAndMetadatasStacker,
        },
        await this.getEventStoreConnector(config),
      ],
    };
  }

  private static async getEventStoreConnector(
    config: EventStoreConnectionConfig,
  ): Promise<Provider> {
    const eventStoreConnector: Client = EventStoreDBClient.connectionString(
      (config as EventStoreConnectionConfig).connectionSettings
        .connectionString,
    );

    return {
      provide: EVENT_STORE_CONNECTOR,
      useValue: eventStoreConnector,
    };
  }
}
