import Client from '../../domain/client';
import Room from '../../domain/room';

export class ClientReservesRoomEvent {
  constructor(
    public readonly client: Client,
    public readonly room: Room,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
