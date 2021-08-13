import { AggregateRoot } from '@nestjs/cqrs';
import { ClientReservesRoomEvent } from './events/impl/client-reserves-room.event';

export class HotelAgreggate extends AggregateRoot {
  constructor(private readonly id: string) {
    super();
  }

  reserveRoom(clientId: string) {
    // logic
    // hotel.reserveRoom[...]
    this.apply(new ClientReservesRoomEvent(this.id));
  }
}
