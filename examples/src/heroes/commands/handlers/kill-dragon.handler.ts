import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroRepository } from '../../repository/hero.repository';
import { KillDragonCommand } from '../impl/kill-dragon.command';
import { WriteEventBus } from 'nestjs-geteventstore/cqrs';
import * as constants from '@eventstore/db-client/dist/constants';
import { Hero } from '../../aggregates/hero.aggregate';

@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: WriteEventBus,
  ) {}

  async execute(command: KillDragonCommand): Promise<KillDragonCommand> {
    const { heroId, dragonId } = command;

    console.log(
      clc.greenBright(
        `KillDragonCommand... for hero ${heroId} on enemy ${dragonId}`,
      ),
    );
    // build aggregate by fetching data from database && add publisher
    // const hero = (await this.repository.findOneById(+heroId)).addPublisher(
    //   this.publisher.publishAll.bind(this.publisher),
    // );
    const hero: Hero = (
      await this.repository.findOneById(+heroId)
    ).addPublisher<WriteEventBus>(this.publisher);

    await hero.damageEnemy(dragonId, 2);
    await hero.damageEnemy(dragonId, -8);
    await hero.damageEnemy(dragonId, 10);
    await hero.damageEnemy(dragonId, 10);
    await hero.damageEnemy(dragonId, -1);
    await hero.damageEnemy(dragonId, 10);
    await hero.damageEnemy(dragonId, 10);
    await hero.damageEnemy(dragonId, 10);
    await hero.damageEnemy(dragonId, 10);
    // await hero.commit(constants.ANY);
    await hero.killEnemy(dragonId);
    await hero.commit(constants.ANY);

    return command;
  }
}
