import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { HeroRepository } from '../../repository/hero.repository';
import { KillDragonCommand } from '../impl/kill-dragon.command';
import { EventStorePublisher, ExpectedVersion } from '../../../../../src/';

@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: EventStorePublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;

    console.log(clc.greenBright(`KillDragonCommand... for hero ${heroId} on enemy ${dragonId}`));
    // add publisher capacity to the repository aggregate
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );

    hero.damageEnemy(dragonId, 3);
    hero.damageEnemy(dragonId, 8);
    hero.damageEnemy(dragonId, 10);
    hero.killEnemy(dragonId);
    // Commit events one by one
    // hero.commit();

    // Commit events in bulk with custom stream
    this.publisher.commitToStream(hero, {
      streamName: `hero_kill-${heroId}`,
      expectedVersion: ExpectedVersion.NoStream,
      maxAge: 3*24*60*60*1000,
    });

    return command;
  }
}
