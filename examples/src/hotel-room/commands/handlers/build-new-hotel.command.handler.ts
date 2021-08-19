import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import CommandResponse from '../response/command.response';
import ESEventBus from '@nestjs-geteventstore/cqrs2/es-event-bus';
import { BuildNewHotelCommand } from '../impl/build-new-hotel.command';
import { HotelBuiltEvent } from '../../events/impl/hotel-built.event';
import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';

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
            streamName: HOTEL_STREAM_NAME,
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
