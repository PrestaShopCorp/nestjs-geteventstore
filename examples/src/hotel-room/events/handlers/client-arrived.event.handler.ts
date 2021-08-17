import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ClientArrivedEvent } from '../impl/client-arrived.event';

@EventsHandler(ClientArrivedEvent)
export class ClientArrivedEventHandler
  implements IEventHandler<ClientArrivedEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientArrivedEvent): void {
    this.logger.debug(
      `Async ClientArrivesEvent... client : ${event.clientId} took room ${event.roomNumber}`,
    );
  }
}
