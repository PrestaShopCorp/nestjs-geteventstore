import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroRepository } from '../../repository/hero.repository';
import { KillDragonCommand } from '../impl/kill-dragon.command';
import { DAY, EventStorePublisher, ExpectedVersion } from '../../../../../src/';
import { EventStore } from 'nestjs-geteventstore';

@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: EventStorePublisher,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;

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

    this.eventStore.commitTransaction();

    return command;
  }
}
