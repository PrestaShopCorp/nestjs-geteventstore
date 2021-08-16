import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotifyClientCommand } from '../impl/notify-client.command';
import { Logger } from '@nestjs/common';
import CommandResponse from '../response/command.response';

@CommandHandler(NotifyClientCommand)
export class NotifyClientCommandHandler
  implements ICommandHandler<NotifyClientCommand>
{
  private readonly logger = new Logger(this.constructor.name);

  async execute(command: NotifyClientCommand) {
    try {
      this.logger.log('Async NotifyClientCommand...');
      this.logger.log('Email sent');

      // publish event
      // ...
      return new CommandResponse('success');
    } catch (e) {
      this.logger.error(e);
      return new CommandResponse('fail');
    }
  }
}
