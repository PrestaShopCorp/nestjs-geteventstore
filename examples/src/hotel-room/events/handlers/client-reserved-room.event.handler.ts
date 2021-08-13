import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClientReservedRoomEvent } from '../impl/client-reserved-room.event';
import { Logger } from '@nestjs/common';

@EventsHandler(ClientReservedRoomEvent)
export class ClientReservedRoomEventHandler
  implements IEventHandler<ClientReservedRoomEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientReservedRoomEvent): void {
    this.logger.log(`Async ClientReservesRoomEvent... `);
  }
}
