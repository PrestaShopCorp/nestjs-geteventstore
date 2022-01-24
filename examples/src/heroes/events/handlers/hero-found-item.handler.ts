import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroFoundItemEvent } from '../impl/hero-found-item.event';

@EventsHandler(HeroFoundItemEvent)
export class HeroFoundItemHandler implements IEventHandler<HeroFoundItemEvent> {
  async handle(event: HeroFoundItemEvent): Promise<void> {
    console.log(
      clc.yellowBright(
        `HeroFoundItemEventHandler handling HeroFoundItemEvent#${event.data.heroId}`,
      ),
    );
  }
}
