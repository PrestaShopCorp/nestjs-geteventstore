import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ContextModule } from 'nestjs-context';
import { LoggerModule } from 'nestjs-pino-stackdriver/dist';
import { resolve } from 'path';

import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { heroesEvents } from './events/impl';
import { HealthController } from './health.controller';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import { CqrsEventStoreModule } from 'nestjs-geteventstore/cqrs-event-store.module';
import { IEventStoreSubsystems } from 'nestjs-geteventstore/event-store/config';
import { EventStoreConnectionConfig } from 'nestjs-geteventstore/event-store/config/event-store-connection-config';
import { EventBusConfigType } from 'nestjs-geteventstore/interfaces';

const eventStoreConnectionConfig: EventStoreConnectionConfig = {
  connectionSettings: {
    connectionString:
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
  },
  defaultUserCredentials: {
    username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
    password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
  },
};

const eventStoreSubsystems: IEventStoreSubsystems = {
  subscriptions: {
    persistent: [
      {
        // Event stream category (before the -)
        stream: '$ce-hero',
        group: 'data',
        settingsForCreation: {
          subscriptionSettings: {
            resolveLinkTos: true,
            minCheckpointCount: 1,
          },
        },
        onError: (err: Error) =>
          console.log(`An error occurred : ${err.message}`),
      },
    ],
  },
  projections: [
    {
      name: 'hero-dragon',
      file: resolve(`${__dirname}/projections/hero-dragon.js`),
      mode: 'continuous',
      enabled: true,
      checkPointsEnabled: true,
      emitEnabled: true,
    },
  ],
  onConnectionFail: (err: Error) =>
    console.log(`Connection to Event store hooked : ${err}`),
};

const eventBusConfig: EventBusConfigType = {
  read: {
    allowedEvents: { ...heroesEvents },
  },
  write: {
    serviceName: 'test',
  },
};

@Module({
  controllers: [HealthController, HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    HeroesGameSagas,
  ],
  imports: [
    ContextModule.register(),
    TerminusModule,
    LoggerModule.forRoot(),
    CqrsEventStoreModule.register(
      eventStoreConnectionConfig,
      eventStoreSubsystems,
      eventBusConfig,
    ),
  ],
})
export class EventStoreHeroesModule {}
