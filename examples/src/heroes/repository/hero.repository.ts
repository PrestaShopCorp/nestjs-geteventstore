import { Injectable } from '@nestjs/common';
import { Hero } from '../aggregates/hero.aggregate';
import { userHero } from './fixtures/user';

@Injectable()
export class HeroRepository {
  async findOneById(id: string): Promise<Hero> {
    return new Hero(id);
  }

  async findAll(): Promise<Hero[]> {
    return [userHero];
  }
}
