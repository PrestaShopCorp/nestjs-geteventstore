import ESEvent from '@nestjs-geteventstore/cqrs-eventstore/events/es-event';
import { ESContext } from '@nestjs-geteventstore/cqrs-eventstore/events/es-context';

export class ClientReservedRoomEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly clientId: string,
    public readonly roomNumber: number,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
