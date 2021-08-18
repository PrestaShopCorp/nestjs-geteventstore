import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import CommandResponse from '../response/command.response';
import ESEventBus from '../../extention/es-event-bus';
import { BuildNewHotelCommand } from '../impl/build-new-hotel.command';
import { HotelBuiltEvent } from '../../events/impl/hotel-built.event';

@CommandHandler(BuildNewHotelCommand)
export class BuildNewHotelCommandHandler
  implements ICommandHandler<BuildNewHotelCommand>
{
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly eventBus: ESEventBus) {}

  public async execute(
    command: BuildNewHotelCommand,
  ): Promise<CommandResponse> {
    try {
      this.logger.debug('Async BuildNewHotelCommand...');

      const { nbRooms } = command;

      await this.eventBus.publish(
        new HotelBuiltEvent(
          {
            streamName: 'hotel-stream',
          },
          nbRooms,
        ),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
