import {CommandBus, CqrsModule, EventBus, QueryBus} from '@nestjs/cqrs';
import {DynamicModule, Module} from '@nestjs/common';

import {EventStoreModule} from './event-store.module';
import {EventBusConfigType, IWriteEventBusConfig, ReadEventBusConfigType,} from './interfaces';
import {ReadEventBus, WriteEventBus} from './cqrs';
import {READ_EVENT_BUS_CONFIG, WRITE_EVENT_BUS_CONFIG,} from './constants';
import {EventBusPrepublishService} from './cqrs/event-bus-prepublish.service';
import {WriteEventsPrepublishService} from './cloudevents';
import {ContextName} from 'nestjs-context';
import {
    IEventStoreConfig,
    IEventStoreModuleAsyncConfig,
    IEventStoreServiceConfig
} from './event-store/config';

const isEventStoreConfig = (
    config: IEventStoreModuleAsyncConfig | IEventStoreConfig,
): config is IEventStoreConfig => {
    return !!config['credentials'];
};

export type EventStoreModuleConfig = IEventStoreModuleAsyncConfig | IEventStoreConfig;

const defaultWriteBusConfig = {
    context: ContextName.HTTP,
    validate: WriteEventsPrepublishService,
    prepare: WriteEventsPrepublishService,
} as IWriteEventBusConfig;

const registerEventStore = (
    config: EventStoreModuleConfig,
    serviceConfig: IEventStoreServiceConfig = {},
) => {
    return {
        imports: [
            isEventStoreConfig(config)
                ? EventStoreModule.registerRgpc(config, serviceConfig)
                : EventStoreModule.registerAsync(config, serviceConfig),
        ],
        exports: [EventStoreModule],
        providers: []
    };
};

@Module({})
export class CqrsEventStoreModule extends CqrsModule {
    static registerSubscriptions(
        eventStoreConfig: EventStoreModuleConfig,
        subscriptions: IEventStoreServiceConfig['subscriptions'],
        eventBusConfig: ReadEventBusConfigType,
    ) {
        return this.registerReadBus(
            eventStoreConfig,
            eventBusConfig,
            subscriptions,
        );
    }

    static registerProjections(
        eventStoreConfig: EventStoreModuleConfig,
        projections: IEventStoreServiceConfig['projections'],
    ) {
        const modules = [registerEventStore(eventStoreConfig, {projections})];
        return {
            module: CqrsEventStoreModule,
            imports: modules.map((module) => module.imports).flat(),
            provides: modules.map((module) => module.providers).flat(),
            exports: modules.map((module) => module.exports).flat(),
        };
    }

    static registerWriteBus(
        eventStoreConfig: EventStoreModuleConfig,
        eventBusConfig: IWriteEventBusConfig = {},
    ): DynamicModule {
        const modules = [registerEventStore(eventStoreConfig)];
        const config = {...defaultWriteBusConfig, ...eventBusConfig};
        return {
            module: CqrsEventStoreModule,
            imports: [
                // @todo this is giving us some problems in subscriptions with SAGA !!!
                //    it does not take into account the @Global and generate 2 diff contexts
                // ContextModule.register(),
                ...modules.map((module) => module.imports).flat(),
            ],
            providers: [
                ...modules.map((module) => module.providers).flat(),
                WriteEventsPrepublishService,
                EventBusPrepublishService,
                CommandBus,
                {
                    provide: WRITE_EVENT_BUS_CONFIG,
                    useValue: config,
                },
                WriteEventBus,
            ],
            exports: [
                ...modules.map((module) => module.exports).flat(),
                CommandBus,
                WriteEventBus,
            ],
        };
    }

    static registerReadBus(
        eventStoreConfig: EventStoreModuleConfig,
        eventBusConfig: ReadEventBusConfigType,
        subscriptions: IEventStoreServiceConfig['subscriptions'] = {},
    ): DynamicModule {
        const modules = [registerEventStore(eventStoreConfig, {subscriptions})];
        return {
            module: CqrsEventStoreModule,
            imports: modules.map((module) => module.imports).flat(),
            providers: [
                ...modules.map((module) => module.providers).flat(),
                EventBusPrepublishService,
                QueryBus,
                {
                    provide: READ_EVENT_BUS_CONFIG,
                    useValue: eventBusConfig,
                },
                ReadEventBus,
                {
                    provide: EventBus,
                    useExisting: ReadEventBus,
                },
            ],
            exports: [
                ...modules.map((module) => module.exports).flat(),
                QueryBus,
                ReadEventBus,
                EventBus,
            ],
        };
    }

    static register(
        eventStoreConfig: EventStoreModuleConfig,
        eventStoreServiceConfig: IEventStoreServiceConfig = {},
        eventBusConfig: EventBusConfigType = {},
    ): DynamicModule {
        // Attention: modules order is important here, as ES service is registered
        //  at the end (and projections + subscriptions are passed in config)
        const modules = [
            ...(eventBusConfig.write
                ? [this.registerWriteBus(eventStoreConfig, eventBusConfig.write)]
                : []),
            ...(eventBusConfig.read
                ? [this.registerReadBus(eventStoreConfig, eventBusConfig.read)]
                : []),
            registerEventStore(eventStoreConfig, eventStoreServiceConfig),
        ];

        return {
            module: CqrsEventStoreModule,
            imports: modules.map((module) => module.imports).flat(),
            providers: modules.map((module) => module.providers).flat(),
            exports: modules.map((module) => module.exports).flat(),
        };
    }
}
