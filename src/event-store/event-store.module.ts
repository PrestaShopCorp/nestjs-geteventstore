import {DynamicModule, Module} from '@nestjs/common';
import {EventStoreService, TcpHttpEventStore} from './index';
import {EventStoreHealthIndicator, EventStoreSubscriptionHealthIndicator,} from './health';
import {EVENT_STORE_SERVICE_CONFIG} from '../constants';
import {EVENT_STORE_CONNECTOR} from './connector/interface/event-store-connector';
import {
    IEventStoreConfig,
    IEventStoreModuleAsyncConfig,
    IEventStoreServiceConfig
} from './config';
import {RGPCEventStore} from './connector/implementations/rgpc/grpc-event-store';
import {GrpcEventStoreConfig} from './config/grpc/grpc-event-store-config';
import TcpHttpEventStoreConfig from './config/tcp-http/tcp-http-event-store.config';

@Module({
            providers: [
                EventStoreService,
                EventStoreHealthIndicator,
                EventStoreSubscriptionHealthIndicator
            ],
            exports: [
                EventStoreService,
                EventStoreHealthIndicator,
                EventStoreSubscriptionHealthIndicator
            ],
        })
export class EventStoreModule {
    static register(
        config: IEventStoreConfig,
        serviceConfig: IEventStoreServiceConfig
    ) {
        return {
            module: EventStoreModule,
            providers: [
                {
                    provide: EVENT_STORE_SERVICE_CONFIG,
                    useValue: serviceConfig,
                },
                {
                    provide: EVENT_STORE_CONNECTOR,
                    useValue: new TcpHttpEventStore(config as TcpHttpEventStoreConfig),
                },
            ],
        };
    }

    static async registerRgpc(
        config: IEventStoreServiceConfig | Promise<IEventStoreServiceConfig>,
        serviceConfig: IEventStoreServiceConfig
    ) {
        const synchedConfig: GrpcEventStoreConfig = await config as GrpcEventStoreConfig;
        return {
            module: EventStoreModule,
            providers: [
                {
                    provide: EVENT_STORE_SERVICE_CONFIG,
                    useValue: serviceConfig,
                },
                {
                    provide: EVENT_STORE_CONNECTOR,
                    useValue: new RGPCEventStore(synchedConfig),
                },
            ],
        };
    }

    static registerAsync(
        options: IEventStoreModuleAsyncConfig,
        serviceConfig: IEventStoreServiceConfig
    ): DynamicModule {
        return {
            module: EventStoreModule,
            providers: [
                {
                    provide: EVENT_STORE_SERVICE_CONFIG,
                    useValue: serviceConfig,
                },
                {
                    provide: EVENT_STORE_CONNECTOR,
                    useFactory: async (configService) => {
                        const config: IEventStoreConfig = await options.useFactory(
                            configService,
                        );
                        return new TcpHttpEventStore(config as TcpHttpEventStoreConfig);
                    },
                    inject: [...options.inject],
                },
            ],
        };
    }
}
