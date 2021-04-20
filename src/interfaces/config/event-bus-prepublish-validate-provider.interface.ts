import { IBaseEvent } from '../events';

export interface IEventBusPrepublishValidateProvider<T extends IBaseEvent> {
  validate<K extends Error = Error>(events: T[]): boolean | K;
}
