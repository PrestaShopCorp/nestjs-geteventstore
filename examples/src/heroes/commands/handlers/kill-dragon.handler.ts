import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroRepository } from '../../repository/hero.repository';
import { KillDragonCommand } from '../impl/kill-dragon.command';
import { ExpectedVersion, WriteEventBus } from '../../../../../src';

@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: WriteEventBus,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;

    console.log(
      clc.greenBright(
        `KillDragonCommand... for hero ${heroId} on enemy ${dragonId}`,
      ),
    );
    // build aggregate by fetching data from database
    const hero = (await this.repository.findOneById(+heroId)).addPublisher(
      this.publisher,
    );

    console.log('handler damage');
    hero.damageEnemy(dragonId, 2);
    hero.damageEnemy(dragonId, -8);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, -1);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    console.log('commit');
    await hero.commit(ExpectedVersion.NoStream);
    console.log('handler kill');
    hero.killEnemy(dragonId);
    await hero.commit(ExpectedVersion.StreamExists);
    console.log('commit');

    return command;
  }
}
