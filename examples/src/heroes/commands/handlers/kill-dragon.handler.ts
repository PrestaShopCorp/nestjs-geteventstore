import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroRepository } from '../../repository/hero.repository';
import { KillDragonCommand } from '../impl/kill-dragon.command';
import { DAY, EventStorePublisher, ExpectedVersion } from '../../../../../src/';

@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: EventStorePublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    await this.publisher.setStreamConfig({
      streamName: `dragon_fight-${dragonId}`,
      metadata: {
        $maxAge: 20 * DAY,
      },
    });
    const transaction = await this.publisher.startTransaction();

    console.log(
      clc.greenBright(
        `KillDragonCommand... for hero ${heroId} on enemy ${dragonId}`,
      ),
    );

    // build aggregate by fetching data from database
    // add publish capacity to the aggregate root
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );

    hero.damageEnemy(dragonId, 2);
    hero.damageEnemy(dragonId, -8);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, -1);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    await hero.commit(`dragon_fight-${dragonId}`, ExpectedVersion.NoStream);

    hero.killEnemy(dragonId);
    await hero.commit(`dragon_fight-${dragonId}`);

    await transaction.commit();

    return command;
  }
}
