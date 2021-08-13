export class ClientLeavedEvent {
  constructor(
    public readonly clientId: string,
    public readonly roomNumber: number,
  ) {}
}
