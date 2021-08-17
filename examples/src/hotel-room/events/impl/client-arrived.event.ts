import ESEvent from '../../extention/es-event';
import { ESContext } from '../../extention/es-context';

export class ClientArrivedEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly clientId: string,
    public readonly roomNumber: number,
  ) {}
}
