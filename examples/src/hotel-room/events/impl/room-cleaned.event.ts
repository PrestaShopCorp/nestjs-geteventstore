import ESEvent from '../../extention/es-event';
import { ESContext } from '../../extention/es-context';

export class RoomCleanedEvent implements ESEvent {
  constructor(
    public readonly context: ESContext,
    public readonly roomNumber: number,
    public readonly result: 'allIsOk' | 'towelsMissing',
  ) {}
}
