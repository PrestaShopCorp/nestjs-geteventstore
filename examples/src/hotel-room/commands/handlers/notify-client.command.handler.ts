import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotifyClientCommand } from '../impl/notify-client.command';
import { Logger } from '@nestjs/common';
import CommandResponse from '../response/command.response';
import { ClientNotifiedEvent } from '../../events/impl/client-notified.event';
import ESEventBus from '@nestjs-geteventstore/cqrs2/event-bus/es-event-bus';
import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';

@CommandHandler(NotifyClientCommand)
export class NotifyClientCommandHandler
  implements ICommandHandler<NotifyClientCommand>
{
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly eventBus: ESEventBus) {}

  public async execute(command: NotifyClientCommand): Promise<CommandResponse> {
    try {
      this.logger.debug('Async NotifyClientCommand...');
      const { clientId, dateArrival, dateLeaving } = command;

      await this.eventBus.publish(
        new ClientNotifiedEvent(
          {
            streamName: HOTEL_STREAM_NAME,
          },
          clientId,
          dateArrival,
          dateLeaving,
        ),
      );

      this.logger.debug('Email sent');

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail', e);
    }
  }
}
