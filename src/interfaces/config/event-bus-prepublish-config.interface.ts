import { Type } from '@nestjs/common';
import { IBaseEvent } from '../events';
import { EventBusPrepublishPrepareCallbackType } from './event-bus-prepublish-prepare-callback.type';
import { IEventBusPrepublishPrepareProvider } from './event-bus-prepublish-prepare-provider.interface';
import { IEventBusPrepublishValidateProvider } from './event-bus-prepublish-validate-provider.interface';

export interface IEventBusPrepublishConfig<T extends IBaseEvent = IBaseEvent> {
  validate?:
    | Type<IEventBusPrepublishValidateProvider<T>>
    | IEventBusPrepublishValidateProvider<T>;
  prepare?:
    | Type<IEventBusPrepublishPrepareProvider<T>>
    | EventBusPrepublishPrepareCallbackType<T>;
}
