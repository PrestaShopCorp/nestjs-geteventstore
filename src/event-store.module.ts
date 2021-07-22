import {DynamicModule, Module} from '@nestjs/common';
import {EventStoreService, TcpHttpEventStore} from './event-store';
import {EventStoreHealthIndicator, EventStoreSubscriptionHealthIndicator,} from './event-store/health';
import {EVENT_STORE_SERVICE_CONFIG} from './constants';
import {EVENT_STORE_CONNECTOR} from './event-store/connector/interface/event-store-connector';
import {
    IEventStoreConfig,
    IEventStoreModuleAsyncConfig,
    IEventStoreServiceConfig
} from './event-store/config';

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
                    useValue: new TcpHttpEventStore(config),
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
                        return new TcpHttpEventStore(config);
                    },
                    inject: [...options.inject],
                },
            ],
        };
    }
}
