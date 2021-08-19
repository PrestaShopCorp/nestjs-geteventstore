import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
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
import ESEventBus from '@nestjs-geteventstore/cqrs2/es-event-bus';
import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';

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
    private readonly eventBus: ESEventBus,
  ) {}

  public async execute(command: PayBillCommand): Promise<CommandResponse> {
    try {
      this.logger.debug('Async PayBillCommand...');

      const { clientId, checkoutResult } = command;
      const hotel: Hotel = new Hotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      const bill: number = await hotel.makesTheClientPay(
        clientId,
        checkoutResult,
      );

      await this.eventBus.publish(
        new ClientPaidEvent(
          {
            streamName: HOTEL_STREAM_NAME,
          },
          clientId,
          bill,
        ),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
