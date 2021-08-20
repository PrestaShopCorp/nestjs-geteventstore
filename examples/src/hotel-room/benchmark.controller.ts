import { Controller, Get, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BuildNewHotelCommand } from './commands/impl/build-new-hotel.command';
import { ClientReservesRoomCommand } from './commands/impl/client-reserves-room.command';
import { v4 } from 'uuid';
import CommandResponse from './commands/response/command.response';

@Controller('hotel-room/bench')
export default class BenchmarkController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Get('run')
  public async reserveRoom(): Promise<CommandResponse> {
    try {
      const totalRoomNumber = 10000;
      await this.commandBus.execute(new BuildNewHotelCommand(totalRoomNumber));

      const commandsResponse: Promise<CommandResponse>[] = [];

      for (let i = 0; i < 10000; i++) {
        commandsResponse.push(
          this.commandBus.execute(
            new ClientReservesRoomCommand(v4(), new Date(), new Date()),
          ),
        );
      }
      await Promise.all(commandsResponse);

      let success = 0;
      let fail = 0;
      for (const command of commandsResponse) {
        const resp = await command;
        if (resp.result === 'success') success++;
        else fail++;
      }

      return new CommandResponse(
        'success',
        `errors : ${fail} and success : ${success}`,
      );
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
