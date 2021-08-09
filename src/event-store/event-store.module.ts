import { DynamicModule, Module } from '@nestjs/common';
import { EventStoreService, TcpHttpEventStore } from './index';
import {
  EventStoreHealthIndicator,
  EventStoreSubscriptionHealthIndicator,
} from './health';
import { EVENT_STORE_SERVICE_CONFIG } from '../constants';
import { EVENT_STORE_CONNECTOR } from './connector/interface/event-store-connector';
import {
  IEventStoreConfig,
  IEventStoreModuleAsyncConfig,
  IEventStoreServiceConfig,
} from './config';
import { RGPCEventStore } from './connector/implementations/rgpc/grpc-event-store';
import { GrpcEventStoreConfig } from './config/grpc/grpc-event-store-config';
import TcpHttpEventStoreConfig from './config/tcp-http/tcp-http-event-store.config';
import { EVENT_STORE_EVENT_HANDLER } from './services/event.handler.interface';
import EventHandler from './services/event.handler';
import { EVENT_STORE_SERVICE } from './services/interfaces/event-store.service.interface';

@Module({
  providers: [
    EventStoreHealthIndicator,
    EventStoreSubscriptionHealthIndicator,
    {
      provide: EVENT_STORE_EVENT_HANDLER,
      useClass: EventHandler,
    },
    {
      provide: EVENT_STORE_SERVICE,
      useClass: EventStoreService,
    },
  ],
  exports: [
    EVENT_STORE_SERVICE,
    EVENT_STORE_EVENT_HANDLER,

    EventStoreHealthIndicator,
    EventStoreSubscriptionHealthIndicator,
  ],
})
export class EventStoreModule {
  static async register(
    config: IEventStoreServiceConfig | Promise<IEventStoreServiceConfig>,
    serviceConfig: IEventStoreServiceConfig = {},
  ): Promise<DynamicModule> {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENT_STORE_SERVICE_CONFIG,
          useValue: serviceConfig,
        },
        await this.getEventStoreConnector(config),
      ],
    };
  }

  static async registerAsync(
    options: IEventStoreModuleAsyncConfig,
    serviceConfig: IEventStoreServiceConfig,
  ): Promise<DynamicModule> {
    return {
      module: EventStoreModule,
      providers: [
        {
          provide: EVENT_STORE_SERVICE_CONFIG,
          useValue: serviceConfig,
        },
        await this.getEventStoreConnector(options),
      ],
    };
  }

  private static async getEventStoreConnector(
    config:
      | IEventStoreServiceConfig
      | Promise<IEventStoreServiceConfig>
      | IEventStoreModuleAsyncConfig,
  ) {
    const synchedConfig: IEventStoreServiceConfig =
      (await config) as IEventStoreServiceConfig;

    if (isRGPCConfig(synchedConfig as GrpcEventStoreConfig)) {
      return {
        provide: EVENT_STORE_CONNECTOR,
        useValue: new RGPCEventStore(synchedConfig as GrpcEventStoreConfig),
      };
    }
    return isEventStoreConfig(config)
      ? {
          provide: EVENT_STORE_CONNECTOR,
          useValue: new TcpHttpEventStore(config as TcpHttpEventStoreConfig),
        }
      : {
          provide: EVENT_STORE_CONNECTOR,
          useValue: new TcpHttpEventStore(config as TcpHttpEventStoreConfig),
        };
  }
}

const isEventStoreConfig = (
  config: IEventStoreModuleAsyncConfig | IEventStoreConfig,
): config is IEventStoreConfig => {
  return !!config['credentials'];
};

const isRGPCConfig = (
  config: IEventStoreModuleAsyncConfig | IEventStoreConfig,
): config is IEventStoreConfig => {
  return !!config['connectionSettings'];
};
