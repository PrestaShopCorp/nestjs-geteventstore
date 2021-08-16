import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NotifyClientCommand } from '../impl/notify-client.command';
import { Logger } from '@nestjs/common';
import CommandResponse from '../response/command.response';
import { ClientNotifiedEvent } from '../../events/impl/client-notified.event';

@CommandHandler(NotifyClientCommand)
export class NotifyClientCommandHandler
  implements ICommandHandler<NotifyClientCommand>
{
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly eventBus: EventBus) {}

  public async execute(command: NotifyClientCommand): Promise<CommandResponse> {
    try {
      this.logger.log('Async NotifyClientCommand...');
      this.logger.log('Email sent');

      const { clientId, dateArrival, dateLeaving } = command;

      this.eventBus.publish(
        new ClientNotifiedEvent(clientId, dateArrival, dateLeaving),
      );

      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail');
    }
  }
}
