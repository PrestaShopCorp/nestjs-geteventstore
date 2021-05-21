import { IBaseEvent } from '../events';

export interface IEventBusPrepublishValidateProvider<T extends IBaseEvent> {
  validate: (events: T[]) => Promise<any[]>;
  onValidationFail: (events: T[], errors: any[]) => void;
}
