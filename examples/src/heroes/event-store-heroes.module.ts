import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ProjectionMode } from 'geteventstore-promise';
import { ContextModule } from 'nestjs-context';
import { LoggerModule } from 'nestjs-pino-stackdriver/dist';
import { resolve } from 'path';
import * as util from 'util';

import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { heroesEvents } from './events/impl';
import { HealthController } from './health.controller';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import { EventStoreProjection } from '@nestjs-geteventstore/interfaces';
import { CqrsEventStoreModule } from '@nestjs-geteventstore/cqrs-event-store.module';

const tcpHttpEvenStoreConfig = {
  defaultUserCredentials: {
    username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
    password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
  },
  options: {
    log: {
      debug: (str, ...args) => {
        Logger.warn(util.format(str, ...args), 'EventStoreCore');
      },
      info: (str, ...args) => {
        Logger.log(util.format(str, ...args), 'EventStoreCore');
      },
      error: (str, ...args) => {
        Logger.log(util.format(str, ...args), 'EventStoreCore');
      },
    },
    // Buffer events if remote is slow or not available
    maxQueueSize: 100_000,
    maxRetries: 10_000,
    operationTimeout: 5_000,
    operationTimeoutCheckPeriod: 1_000,
    // Fail fast on connect
    clientConnectionTimeout: 2_000,
    failOnNoServerResponse: true,
    // Try to reconnect every 10s for 30mn
    maxReconnections: 200,
    reconnectionDelay: 10_000,
    // Production heartbeat
    heartbeatInterval: 10_000,
    heartbeatTimeout: 3_000,
  },
  onTcpDisconnected: () => {
    Logger.error(`Connection to eventstore lost`, undefined, 'EventStoreCore');
    //process.exit(137);
  },
  onTcpConnected: () => {},
};

const rGPCEventStoreConf = {
  ...tcpHttpEvenStoreConfig,
  connectionSettings: {
    connectionString:
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
  },
};

const subscriptions = {
  persistent: [
    {
      // Event stream category (before the -)
      stream: '$ce-hero',
      group: 'data',
      autoAck: false,
      bufferSize: 500,
      // Subscription is created with this options
      options: {
        resolveLinkTos: true,
        minCheckPointCount: 1,
      },
    },
  ],
};
const projections: EventStoreProjection[] = [
  {
    name: 'hero-dragon',
    file: resolve(`${__dirname}/projections/hero-dragon.js`),
    mode: 'continuous',
    enabled: true,
    checkPointsEnabled: true,
    emitEnabled: true,
  },
];
const eventBusConfig = {
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
      rGPCEventStoreConf,
      { subscriptions, projections },
      eventBusConfig,
    ),
  ],
})
export class EventStoreHeroesModule {}
