import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import HotelRepository from '../../repositories/hotel.repository.stub';
import { ClientReservesRoomCommand } from '../impl/client-reserves-room.command';
import { Inject, Logger } from '@nestjs/common';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';
import Hotel from '../../domain/hotel';
import Client from '../../domain/client';
import CommandResponse from '../response/command.response';
import { ClientReservedRoomEvent } from '../../events/impl/client-reserved-room.event';
import Room from '../../domain/room';

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
    private readonly eventBus: EventBus,
  ) {}

  public async execute(
    command: ClientReservesRoomCommand,
  ): Promise<CommandResponse> {
    try {
      this.logger.log('Async ClientReservesRoomCommand...');

      const { clientId, dateArrival, dateLeaving } = command;
      const hotel: Hotel = await this.repository.getHotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      const room: Room = await hotel.reserveRoom(
        new Client(clientId),
        dateArrival,
        dateLeaving,
      );

      this.eventBus.publish(
        new ClientReservedRoomEvent(
          new Client(clientId),
          room,
          dateArrival,
          dateLeaving,
        ),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail');
    }
  }
}
