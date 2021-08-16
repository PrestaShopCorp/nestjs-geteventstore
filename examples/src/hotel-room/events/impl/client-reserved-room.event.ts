export class ClientReservedRoomEvent {
  constructor(
    public readonly clientId: string,
    public readonly roomNumber: number,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
