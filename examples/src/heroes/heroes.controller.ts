import { Body, Controller, Get, Param, Put, UseInterceptors } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { KillDragonCommand } from './commands/impl/kill-dragon.command';
import { KillDragonDto } from './interfaces/kill-dragon-dto.interface';
import { Hero } from './aggregates/hero.aggregate';
import { GetHeroesQuery } from './queries/impl';
import { EventStoreInterceptor } from '../../../src/interceptor/event-store.interceptor';

@UseInterceptors(EventStoreInterceptor)
@Controller('hero')
export class HeroesGameController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put(':id/kill')
  async killDragon(@Param('id') id: string, @Body() dto: KillDragonDto) {
    return this.commandBus.execute(new KillDragonCommand(id, dto.dragonId));
  }

  @Get()
  async findAll(): Promise<Hero[]> {
    return this.queryBus.execute(new GetHeroesQuery());
  }
}
