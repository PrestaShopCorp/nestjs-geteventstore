import ESEvent from '../../extention/es-event';
import { ESContext } from '../../extention/es-context';

export class ClientReservedRoomEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly clientId: string,
    public readonly roomNumber: number,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
