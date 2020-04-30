import { Module } from '@nestjs/common';
import { HeroesGameModule } from './heroes/heroes.module';
import { EventStoreHeroesModule } from './heroes/event-store-heroes.module';

@Module({
  imports: [HeroesGameModule],
})
export class ApplicationModule {}

@Module({
  imports: [EventStoreHeroesModule],
})
export class EventStoredApplicationModule {}
