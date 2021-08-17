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
import { PayBillCommand } from '../impl/pay-bill.command';
import Hotel from '../../domain/hotel';
import CommandResponse from '../response/command.response';
import { ClientPaidEvent } from '../../events/impl/client-paid.event';
import ESEventBus from '../../extention/es-event-bus';

@CommandHandler(PayBillCommand)
export class PayBillCommandHandler implements ICommandHandler<PayBillCommand> {
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

  public async execute(command: PayBillCommand): Promise<CommandResponse> {
    try {
      this.logger.debug('Async PayBillCommand...');

      const { clientId, checkoutResult } = command;
      const hotel: Hotel = await this.repository.getHotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      await this.checkClientWasThere(clientId);

      const bill: number = await hotel.makesTheClientPay(
        clientId,
        checkoutResult,
      );

      await this.eventBus.publish(
        new ClientPaidEvent(
          {
            streamName: 'hotel-stream',
          },
          clientId,
          bill,
        ),
      );

      this.repository.freeRoom(clientId);

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }

  private async checkClientWasThere(clientId: string) {
    await this.repository.getClientRoom(clientId);
  }
}
