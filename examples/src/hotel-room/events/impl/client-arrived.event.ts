export class ClientArrivedEvent {
  constructor(
    public readonly clientId: string,
    public readonly roomNumber: number,
  ) {}
}
