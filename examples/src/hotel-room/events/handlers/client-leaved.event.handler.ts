import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ClientLeavedEvent } from '../impl/client-leaved.event';

@EventsHandler(ClientLeavedEvent)
export class ClientLeavedEventHandler
  implements IEventHandler<ClientLeavedEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientLeavedEvent): void {
    this.logger.log(
      `Async ClientLeavesEventHandler... client : ${event.clientId} leaves room ${event.roomNumber}`,
    );
  }
}
