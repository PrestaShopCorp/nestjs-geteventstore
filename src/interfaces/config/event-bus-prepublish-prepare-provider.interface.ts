import { IBaseEvent } from '../events';

export interface IEventBusPrepublishPrepareProvider<T extends IBaseEvent> {
  prepare(events: T[]): T[];
}
