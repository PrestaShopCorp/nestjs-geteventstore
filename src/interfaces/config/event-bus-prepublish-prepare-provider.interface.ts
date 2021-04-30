import { IBaseEvent } from '../events';
import { EventBusPrepublishPrepareType } from './event-bus-prepublish-prepare.type';

export interface IEventBusPrepublishPrepareProvider<
  T extends IBaseEvent,
  K extends IBaseEvent = T
> {
  prepare: EventBusPrepublishPrepareType<T, K>;
}
