import Client from '../../domain/client';
import Room from '../../domain/room';

export class ClientReservedRoomEvent {
  constructor(
    public readonly client: Client,
    public readonly room: Room,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
