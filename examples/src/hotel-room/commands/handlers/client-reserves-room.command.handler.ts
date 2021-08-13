import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import HotelRepository from '../../repositories/hotel.repository.stub';
import { ClientReservesRoomCommand } from '../impl/client-reserves-room.command';
import { HotelAgreggate } from '../../hotel.agreggate';
import { Inject, Logger } from '@nestjs/common';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';

@CommandHandler(ClientReservesRoomCommand)
export class ClientReservesRoomCommandHandler
  implements ICommandHandler<ClientReservesRoomCommand>
{
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(ROOM_REGISTRY)
    private readonly roomRegistryHandler: RoomRegistry,
    @Inject(CLIENT_NOTIFIER)
    private readonly clientNotifierHandler: ClientNotifier,
    @Inject(HOUSE_MAID)
    private readonly houseMaidHandler: HouseMaid,
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,

    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: ClientReservesRoomCommand) {
    this.logger.log('Async ClientReservesRoomCommand...');

    const { clientId, dateArrival, dateLeaving } = command;
    const hotel: HotelAgreggate = this.publisher.mergeObjectContext(
      await this.repository.getHotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      ),
    );
    await hotel.reserveRoom(clientId, dateArrival, dateLeaving);
    hotel.commit();
  }
}
