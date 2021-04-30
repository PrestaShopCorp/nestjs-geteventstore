import { IBaseEvent } from '../events';
import { EventBusPrepublishValidateType } from './event-bus-prepublish-validate.type';
import { EventBusPrepublishOnValidationFailType } from './event-bus-prepublish-on-validation-fail.type';

export interface IEventBusPrepublishValidateProvider<T extends IBaseEvent> {
  validate: EventBusPrepublishValidateType<T>;
  onValidationFail: EventBusPrepublishOnValidationFailType<T>;
}
