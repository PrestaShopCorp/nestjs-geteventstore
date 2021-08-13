import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { NotifyClientEvent } from '../impl/notify-client.event';
import { Logger } from '@nestjs/common';

@EventsHandler(NotifyClientEvent)
export class NotifyClientEventHandler
  implements IEventHandler<NotifyClientEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: NotifyClientEvent): void {
    this.logger.log(`Async NotifyClientEvent... `);
  }
}
