import { IBaseEvent } from '../events';
import { IEventBusPrepublishValidateProvider } from './event-bus-prepublish-validate-provider.interface';
import { IEventBusPrepublishPrepareProvider } from './event-bus-prepublish-prepare-provider.interface';
import { EventBusPrepublishValidateType } from './event-bus-prepublish-validate.type';
import { EventBusPrepublishPrepareType } from './event-bus-prepublish-prepare.type';
import { EventBusPrepublishOnValidationFailType } from './event-bus-prepublish-on-validation-fail.type';

export interface IEventBusPrepublishConfig<T extends IBaseEvent = IBaseEvent> {
  validate?:
    | IEventBusPrepublishValidateProvider<T>
    | {
        onValidationFail?: EventBusPrepublishOnValidationFailType<T>;
        validate: EventBusPrepublishValidateType<T>;
      };
  prepare?:
    | IEventBusPrepublishPrepareProvider<T>
    | EventBusPrepublishPrepareType<T>;
}
