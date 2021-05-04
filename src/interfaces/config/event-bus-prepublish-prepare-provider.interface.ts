import { IBaseEvent } from '../events';
import { EventBusPrepublishPrepareCallbackType } from './event-bus-prepublish-prepare-callback.type';

export interface IEventBusPrepublishPrepareProvider<
  T extends IBaseEvent,
  K extends IBaseEvent = T
> {
  prepare: EventBusPrepublishPrepareCallbackType<T, K>;
}
