import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ClientPaidEvent } from '../impl/client-paid.event';

@EventsHandler(ClientPaidEvent)
export class ClientPaidEventHandler implements IEventHandler<ClientPaidEvent> {
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientPaidEvent): void {
    this.logger.debug(
      `Async ClientPaidEvent... client : ${event.clientId} paid ${event.bill}`,
    );
  }
}
