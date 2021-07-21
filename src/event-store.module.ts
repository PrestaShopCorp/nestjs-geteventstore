import {DynamicModule, Module} from '@nestjs/common';
import {EventStore, EventStoreService} from './event-store';
import {
    IEventStoreConfig,
    IEventStoreModuleAsyncConfig,
    IEventStoreServiceConfig
} from './interfaces';
import {EventStoreHealthIndicator, EventStoreSubscriptionHealthIndicator,} from './health';
import {EVENT_STORE_SERVICE_CONFIG} from './constants';

@Module({
            providers: [
                EventStoreService,
                EventStoreHealthIndicator,
                EventStoreSubscriptionHealthIndicator
            ],
            exports: [
                EventStore,
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
                    provide: EventStore,
                    useValue: new EventStore(config),
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
                    provide: EventStore,
                    useFactory: async (configService) => {
                        const config: IEventStoreConfig = await options.useFactory(
                            configService,
                        );
                        return new EventStore(config);
                    },
                    inject: [...options.inject],
                },
            ],
        };
    }
}
