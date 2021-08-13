import { Controller, Get, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ClientReservesRoomCommand } from './commands/impl/client-reserves-room.command';

@Controller('hotel-room')
export default class HotelRoomController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get('reserves/:clientId/')
  async reserveRoom(@Param('clientId') clientId: string) {
    return this.commandBus.execute(
      new ClientReservesRoomCommand(clientId, new Date(), new Date()),
    );
  }
}
