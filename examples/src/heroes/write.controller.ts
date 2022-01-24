import { Body, Controller, Param, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { KillDragonCommand } from './commands/impl/kill-dragon.command';
import { KillDragonDto } from './interfaces/kill-dragon-dto.interface';

@Controller('hero')
export class WriteController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id/kill')
  async killDragon(
    @Param('id') id: string,
    @Body() dto: KillDragonDto,
  ): Promise<any> {
    return this.commandBus.execute(new KillDragonCommand(id, dto.dragonId));
  }
}
