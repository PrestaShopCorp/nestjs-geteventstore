export class ClientPaidEvent {
  constructor(public readonly clientId: string, public readonly bill: number) {}
}
