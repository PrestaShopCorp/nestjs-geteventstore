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
    // Use custom stream only for this process
    await hero.setStreamConfig({
      streamName: `dragon_killed-${dragonId}`,
      // Bug if the stream is not new when writing
      expectedVersion: ExpectedVersion.NoStream,
      // Set retention rules for this new stream
      metadata: {
        $maxAge: 2 * DAY,
        $maxCount: 5,
      },
    });

    hero.damageEnemy(dragonId, 2);
    hero.damageEnemy(dragonId, -8);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, -1);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    hero.damageEnemy(dragonId, 10);
    await hero.commit();

    // Change stream for final event
    await hero.setStreamConfig({
      streamName: `hero-${heroId}`,
      // It must be a new stream
      expectedVersion: ExpectedVersion.NoStream,
    });
    hero.killEnemy(dragonId);
    await hero.commit();

    return command;
  }
}
