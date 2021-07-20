import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EventStoreService } from './index';
import {
  EventStoreHealthIndicator,
  EventStoreSubscriptionHealthIndicator,
} from './health';
import { EVENT_STORE_SUBSYSTEMS } from '../constants';
import { IEventStoreSubsystems } from './config';
import { EventStoreConnectionConfig } from './config/event-store-connection-config';
import { EVENT_STORE_SERVICE } from './services/event-store.service.interface';
import { Client } from '@eventstore/db-client/dist/Client';
import { EventStoreDBClient } from '@eventstore/db-client';
import { EVENT_STORE_CONNECTOR } from './services/event-store.constants';
import { EVENT_AND_METADATAS_STACKER } from './config/connection-fallback/interface/events-and-metadatas-stacker';
import InMemoryEventsAndMetadatasStacker from './config/connection-fallback/implementations/in-memory/in-memory-events-and-metadatas-stacker';

@Module({
  providers: [
    EventStoreHealthIndicator,
    EventStoreSubscriptionHealthIndicator,
    {
      provide: EVENT_STORE_SERVICE,
      useClass: EventStoreService,
    },
  ],
  exports: [
    EVENT_STORE_SERVICE,

    EventStoreHealthIndicator,
    EventStoreSubscriptionHealthIndicator,
  ],
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
          provide: EVENT_AND_METADATAS_STACKER,
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
