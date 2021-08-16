export class ClientReservesRoomCommand {
  constructor(
    public readonly clientId: string,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}