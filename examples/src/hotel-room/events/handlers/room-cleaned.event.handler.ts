import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { RoomCleanedEvent } from '../impl/room-cleaned.event';

@EventsHandler(RoomCleanedEvent)
export class RoomCleanedEventHandler
  implements IEventHandler<RoomCleanedEvent>
{
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: RoomCleanedEvent): void {
    this.logger.log(
      `Async CleanRoomEventHandler... room ${event.roomNumber} cleaned and ${event.result}`,
    );
  }
}
