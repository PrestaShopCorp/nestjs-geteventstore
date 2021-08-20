import ESEvent from '@nestjs-geteventstore/cqrs2/events/es-event';
import { ESContext } from '@nestjs-geteventstore/cqrs2/events/es-context';

export class ClientPaidEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly clientId: string,
    public readonly bill: number,
  ) {}
}
