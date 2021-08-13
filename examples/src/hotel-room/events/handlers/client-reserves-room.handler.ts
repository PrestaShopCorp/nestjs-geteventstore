import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { ClientReservesRoomEvent } from '../impl/client-reserves-room.event';

@EventsHandler(ClientReservesRoomEvent)
export class HeroFoundItemHandler
  implements IEventHandler<ClientReservesRoomEvent>
{
  public handle(event: ClientReservesRoomEvent): void {
    console.log(clc.yellowBright('Async ClientReservesRoomEvent...'));
  }
}
