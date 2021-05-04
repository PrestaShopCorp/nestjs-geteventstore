import { Type } from '@nestjs/common';
import { IBaseEvent } from '../events';
import { IEventBusPrepublishValidateProvider } from './event-bus-prepublish-validate-provider.interface';
import { IEventBusPrepublishPrepareProvider } from './event-bus-prepublish-prepare-provider.interface';
import { EventBusPrepublishPrepareCallbackType } from './event-bus-prepublish-prepare-callback.type';

export interface IEventBusPrepublishConfig<T extends IBaseEvent = IBaseEvent> {
  validate?:
    | Type<IEventBusPrepublishValidateProvider<T>>
    | IEventBusPrepublishValidateProvider<T>;
  prepare?:
    | Type<IEventBusPrepublishPrepareProvider<T>>
    | EventBusPrepublishPrepareCallbackType<T>;
}
