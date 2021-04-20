import { ClassProvider } from '@nestjs/common';
import { IBaseEvent } from '../events';
import { IEventBusPrepublishValidateProvider } from './event-bus-prepublish-validate-provider.interface';
import { IEventBusPrepublishPrepareProvider } from './event-bus-prepublish-prepare-provider.interface';
import { EventBusPrepublishValidateCallbackType } from './event-bus-prepublish-validate-callback.type';
import { EventBusPrepublishPrepareCallbackType } from './event-bus-prepublish-prepare-callback.type';

type ValidateProviderType<T extends IBaseEvent> = ClassProvider<
  IEventBusPrepublishValidateProvider<T>
>['provide'];
type PrepareProviderType<T extends IBaseEvent> = ClassProvider<
  IEventBusPrepublishPrepareProvider<T>
>['provide'];

export interface IEventBusPrepublishConfig<T extends IBaseEvent = IBaseEvent> {
  validate?:
    | ValidateProviderType<T>
    | EventBusPrepublishValidateCallbackType<T>;
  prepare?: PrepareProviderType<T> | EventBusPrepublishPrepareCallbackType<T>;
}
