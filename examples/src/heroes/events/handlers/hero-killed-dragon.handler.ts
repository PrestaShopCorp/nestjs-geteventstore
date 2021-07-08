import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroKilledDragonEvent } from '../impl/hero-killed-dragon.event';

@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler
  implements IEventHandler<HeroKilledDragonEvent>
{
  async handle(event: HeroKilledDragonEvent) {
    console.log(clc.greenBright('HeroKilledDragonEventHandler...'));
    await event.ack();
  }
}
