import { IBaseEvent } from '../events';

export interface IEventBusPrepublishConfig<T extends IBaseEvent = IBaseEvent> {
  validateEvents?: <K extends Error = Error>(events: T[]) => boolean | K;
  prepareEvents?: (events: T[]) => T[];
}
