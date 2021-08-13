import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClientNotifiedEvent } from '../impl/client-notified.event';
import { Logger } from '@nestjs/common';

@EventsHandler(ClientNotifiedEvent)
export class ClientNotifiedEventHandler
  implements IEventHandler<ClientNotifiedEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientNotifiedEvent): void {
    this.logger.log(`Async NotifyClientEvent... `);
  }
}
