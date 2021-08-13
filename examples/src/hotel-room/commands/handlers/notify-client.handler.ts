import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { NotifyClientCommand } from '../impl/notify-client.command';
import HotelRepository from '../../repositories/hotel.repository';
import { HotelAgreggate } from '../../hotel.agreggate';

@CommandHandler(NotifyClientCommand)
export class NotifyClientHandler
  implements ICommandHandler<NotifyClientCommand>
{
  constructor(
    private readonly repository: HotelRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: NotifyClientCommand) {
    console.log(clc.yellowBright('Async NotifyClientCommand...'));

    const { clientId } = command;
    const hotel: HotelAgreggate = this.publisher.mergeObjectContext(
      await this.repository.getHotel(),
    );
    // hotel.otifyClient(itemId);
    // hero.commit();
  }
}
