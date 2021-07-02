import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventStore } from '../../../src';

import { KillDragonCommand } from './commands/impl/kill-dragon.command';
import { KillDragonDto } from './interfaces/kill-dragon-dto.interface';
import { Hero } from './aggregates/hero.aggregate';
import { GetHeroesQuery } from './queries/impl';

@Controller('hero')
export class HeroesGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventStore: EventStore,
  ) {}

  @Put(':id/kill')
  async killDragon(@Param('id') id: string, @Body() dto: KillDragonDto) {
    return this.commandBus.execute(new KillDragonCommand(id, dto.dragonId));
  }

  @Get()
  async findAll(): Promise<Hero[]> {
    return this.queryBus.execute(new GetHeroesQuery());
  }

  @Get('test')
  async test() {
    let first = 0;
    const count = 10;

    console.log('Test Handler!');

    do {
      const response = await this.eventStore.readEventsForward({
        stream: '$category-hero',
        first,
        count
      });

      const streams = response.events;
      for (const stream of streams) {
        console.log('---------------\n\n\n');
        console.log(JSON.stringify(stream, null, 4));
      }

      first += 10;
      if (response.isEndOfStream) break;
    } while (true);
    // console.log('Test Handler!');
    // console.log(this.eventStore.getProjectionState);
    // console.log(await this.eventStore.getProjectionState('partitioned-hero'));
    // console.log(await this.eventStore.getProjectionState('partitioned-hero', '1'));
  }
}
