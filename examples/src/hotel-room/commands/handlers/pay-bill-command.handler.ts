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
import { PayBillCommand } from '../impl/payBillCommand';
import Hotel from '../../domain/hotel';
import CommandResponse from '../response/command.response';
import Client from '../../domain/client';

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
  ) {}

  async execute(command: PayBillCommand) {
    try {
      this.logger.log('Async ClientReservesRoomCommand...');

      const { clientId, checkoutResult } = command;
      const hotel: Hotel = await this.repository.getHotel(
        this.roomRegistryHandler,
        this.clientNotifierHandler,
        this.houseMaidHandler,
      );

      await hotel.makesTheClientPay(new Client(clientId), checkoutResult);

      // publish event
      // ...
      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail');
    }
  }
}
