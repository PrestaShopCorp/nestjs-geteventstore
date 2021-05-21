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
    // build aggregate by fetching data from database && add publisher
    // const hero = (await this.repository.findOneById(+heroId)).addPublisher(
    //   this.publisher.publishAll.bind(this.publisher),
    // );
    const hero = (
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
    await hero.commit(ExpectedVersion.NoStream);
    await hero.killEnemy(dragonId);
    await hero.commit(ExpectedVersion.StreamExists);

    return command;
  }
}
