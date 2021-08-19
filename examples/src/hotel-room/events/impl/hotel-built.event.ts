import ESEvent from '@nestjs-geteventstore/cqrs2/es-event';
import { ESContext } from '@nestjs-geteventstore/cqrs2/es-context';

export class HotelBuiltEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly nbRooms: number,
  ) {}
}
