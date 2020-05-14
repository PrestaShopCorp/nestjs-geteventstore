import { Logger, Module } from '@nestjs/common';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import { heroesEvents } from './events/impl';
import { EventStoreCqrsModule, IEventStoreEventOptions } from '../../../src';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    TerminusModule,
    EventStoreCqrsModule.registerAsync(
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
        onTcpConnected: () => {},
        onTcpDisconnected: () => {},
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
                resolveLinktos: true,
                minCheckPointCount: 1,
              },
            },
          ],
        },
      },
    ),
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
