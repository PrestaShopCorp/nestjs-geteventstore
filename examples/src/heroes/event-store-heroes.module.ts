import { LoggerModule } from 'nestjs-pino-stackdriver/dist';
import * as util from 'util';

import {
  Logger,
  Module,
} from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import {
  EventStoreCqrsModule,
  IEventStoreEventOptions,
} from '../../../src';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { heroesEvents } from './events/impl';
import { HealthController } from './health.controller';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';

@Module({
  imports: [
    TerminusModule,
    EventStoreCqrsModule.register(
      {
        credentials: {
          username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
          password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
        },
        tcp: {
          host: process.env.EVENTSTORE_TCP_HOST || 'localhost',
          port: +process.env.EVENTSTORE_TCP_PORT || 11113,
        },
        http: {
          host: process.env.EVENTSTORE_HTTP_HOST || 'http://localhost',
          port: +process.env.EVENTSTORE_HTTP_PORT || 22113,
        },
        tcpConnectionName: 'connection-hero-event-handler-and-saga',
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
          Logger.error(
            `Connection to eventstore lost`,
            undefined,
            'EventStoreCore',
          );
          //process.exit(137);
        },
        onTcpConnected: () => {},
      },
      {
        eventMapper: (data, options: IEventStoreEventOptions) => {
          let className = `${options.eventType}`;
          if (!heroesEvents[className]) {
            return false;
          }
          Logger.debug(
            `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId}`,
          );
          return new heroesEvents[className](data, options);
        },
        subscriptions: {
          persistent: [
            {
              // Event stream category (before the -)
              stream: '$ce-hero',
              group: 'data',
              autoAck: false,
              bufferSize: 1,
              // Subscription is created with this options
              options: {
                resolveLinkTos: true,
                minCheckPointCount: 1,
              },
            },
          ],
        },
      },
    ),
    LoggerModule.forRoot(),
  ],
  controllers: [HealthController, HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    HeroesGameSagas,
  ],
})
export class EventStoreHeroesModule {}
