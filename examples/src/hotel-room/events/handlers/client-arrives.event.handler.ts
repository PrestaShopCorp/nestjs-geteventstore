import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ClientArrivesEvent } from '../impl/client-arrives.event';

@EventsHandler(ClientArrivesEvent)
export class ClientArrivesEventHandler
  implements IEventHandler<ClientArrivesEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientArrivesEvent): void {
    this.logger.log(
      `Async ClientArrivesEvent... client : ${event.clientId} took room ${event.roomNumber}`,
    );
  }
}
