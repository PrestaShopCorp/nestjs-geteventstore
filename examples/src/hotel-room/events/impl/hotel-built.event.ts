import ESEvent from '../../extention/es-event';
import { ESContext } from '../../extention/es-context';

export class HotelBuiltEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly nbRooms: number,
  ) {}
}
