import ESEvent from '../../extention/es-event';
import { ESContext } from '../../extention/es-context';

export class ClientNotifiedEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly clientId: string,
    public readonly dateArrival: Date,
    public readonly dateLeaving: Date,
  ) {}
}
