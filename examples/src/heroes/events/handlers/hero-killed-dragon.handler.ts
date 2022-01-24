import { IEventHandler } from '@nestjs/cqrs';
import { EventsHandler } from '@nestjs/cqrs/dist/decorators/events-handler.decorator';
import * as clc from 'cli-color';
import { HeroKilledDragonEvent } from '../impl/hero-killed-dragon.event';

@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler
  implements IEventHandler<HeroKilledDragonEvent>
{
  async handle(event: HeroKilledDragonEvent): Promise<void> {
    console.log(clc.greenBright('HeroKilledDragonEventHandler...'));
    await event.ack();
  }
}
