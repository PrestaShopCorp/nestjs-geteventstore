import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { WriteEventBus } from '../../../../../src/';
import { HeroRepository } from '../../repository/hero.repository';
import { DropAncientItemCommand } from '../impl/drop-ancient-item.command';

@CommandHandler(DropAncientItemCommand)
export class DropAncientItemHandler
  implements ICommandHandler<DropAncientItemCommand>
{
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: WriteEventBus,
  ) {}

  async execute(command: DropAncientItemCommand) {
    console.log(clc.yellowBright('Async DropAncientItemCommand...'));

    const { heroId, itemId } = command;
    const hero = await this.repository.findOneById(heroId);
    hero.autoCommit = true;
    hero.maxAge = 600; // 10 min
    hero.addPublisher((events, context) =>
      this.publisher.publishAll(events, context),
    );
    await hero.addItem(itemId);
    await hero.dropItem(itemId);
  }
}
