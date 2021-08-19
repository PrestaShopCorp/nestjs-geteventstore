import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClientReservesRoomCommand } from '../impl/client-reserves-room.command';
import { Inject, Logger } from '@nestjs/common';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';
import Hotel from '../../domain/hotel';
import CommandResponse from '../response/command.response';
import { ClientReservedRoomEvent } from '../../events/impl/client-reserved-room.event';
import Room from '../../domain/room';
import ESEventBus from '@nestjs-geteventstore/cqrs2/es-event-bus';

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
    private readonly eventBus: ESEventBus,
  ) {}

  public async execute(
    command: ClientReservesRoomCommand,
  ): Promise<CommandResponse> {
    try {
      this.logger.debug('Async ClientReservesRoomCommand...');

      const { clientId, dateArrival, dateLeaving } = command;

      const hotel: Hotel = new Hotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      const room: Room = await hotel.reserveRoom(
        clientId,
        dateArrival,
        dateLeaving,
      );

      if (room === null) {
        const message = 'Hotel is full';
        this.logger.error(message);
        return new CommandResponse('fail', message);
      }

      await this.eventBus.publish(
        new ClientReservedRoomEvent(
          {
            streamName: 'hotel-stream',
          },
          clientId,
          room.getNumber(),
          dateArrival,
          dateLeaving,
        ),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
