import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { Hero } from '../../aggregates/hero.aggregate';
import { HeroRepository } from '../../repository/hero.repository';
import { GetHeroesQuery } from '../impl';

@QueryHandler(GetHeroesQuery)
export class GetHeroesHandler implements IQueryHandler<GetHeroesQuery> {
  constructor(private readonly repository: HeroRepository) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(query: GetHeroesQuery): Promise<Hero[]> {
    console.log(clc.yellowBright('Async GetHeroesQuery...'));
    return this.repository.findAll();
  }
}
