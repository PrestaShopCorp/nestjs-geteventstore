import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import HotelRepository from '../../repositories/hotel.repository';
import { ClientReservesRoomCommand } from '../impl/client-reserves-room.command';
import { HotelAgreggate } from '../../hotel.agreggate';

@CommandHandler(ClientReservesRoomCommand)
export class ClientReservesRoomHandler
  implements ICommandHandler<ClientReservesRoomCommand>
{
  constructor(
    private readonly repository: HotelRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ClientReservesRoomCommand) {
    console.log(clc.yellowBright('Async ClientReservesRoomCommand...'));

    const { clientId } = command;
    const hotel: HotelAgreggate = this.publisher.mergeObjectContext(
      await this.repository.getHotel(),
    );
    hotel.reserveRoom(clientId);
    hotel.commit();
  }
}
