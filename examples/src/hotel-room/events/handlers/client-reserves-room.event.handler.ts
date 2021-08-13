import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClientReservesRoomEvent } from '../impl/client-reserves-room.event';
import { Logger } from '@nestjs/common';

@EventsHandler(ClientReservesRoomEvent)
export class ClientReservesRoomEventHandler
  implements IEventHandler<ClientReservesRoomEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: ClientReservesRoomEvent): void {
    this.logger.log(`Async ClientReservesRoomEvent... `);
  }
}
