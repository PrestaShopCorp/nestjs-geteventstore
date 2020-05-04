import { Logger, Module } from '@nestjs/common';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import { heroesEvents } from './events/impl/index';
import { EventStoreBusConfig, EventStoreCqrsModule, IEventStoreConfig } from '../../../src';

@Module({
  imports: [
    EventStoreCqrsModule.forRootAsync(
      {
        useFactory: () =>
          ({
            credentials: {
              username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
              password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
            },
            tcp: {
              host: process.env.EVENTSTORE_TCP_HOST || 'localhost',
              port: process.env.EVENTSTORE_TCP_PORT || 11113,
            },
            http: {
              host: process.env.EVENTSTORE_HTTP_HOST || 'http://localhost',
              port: process.env.EVENTSTORE_HTTP_PORT || 22113,
            },
          } as IEventStoreConfig),
      },
      {
        eventMapper: (event) => {
          let className = `${event.eventType}`;
          Logger.log(
            `Build ${className} received from stream ${event.eventStreamId} with id ${event.eventId}`,
          );
          return new heroesEvents[className](event.data);
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
      } as EventStoreBusConfig,
    ),
  ],
  controllers: [HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    HeroesGameSagas,
  ],
})
export class EventStoreHeroesModule {
}
