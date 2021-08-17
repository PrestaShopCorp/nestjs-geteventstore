import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import HotelRepository from '../../repositories/hotel.repository.stub';
import { Inject, Logger } from '@nestjs/common';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';
import { ClientArrivesCommand } from '../impl/client-arrives.command';
import Hotel from '../../domain/hotel';
import CommandResponse from '../response/command.response';
import { ClientArrivedEvent } from '../../events/impl/client-arrived.event';
import ESEventBus from '../../extention/es-event-bus';

@CommandHandler(ClientArrivesCommand)
export class ClientArrivesCommandHandler
  implements ICommandHandler<ClientArrivesCommand>
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
    private readonly eventBus: ESEventBus,
  ) {}

  public async execute(
    command: ClientArrivesCommand,
  ): Promise<CommandResponse> {
    try {
      this.logger.debug('Async ClientArrivesCommand...');

      const { clientId } = command;
      const hotel: Hotel = await this.repository.getHotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      const roomNumber: number = await hotel.givesKeyToClient(clientId);

      await this.eventBus.publish(
        new ClientArrivedEvent(
          {
            streamName: 'hotel-stream',
          },
          clientId,
          roomNumber,
        ),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
