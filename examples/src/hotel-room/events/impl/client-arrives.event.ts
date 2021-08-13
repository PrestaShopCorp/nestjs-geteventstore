export class ClientArrivesEvent {
  constructor(
    public readonly clientId: string,
    public readonly roomNumber: number,
  ) {}
}
