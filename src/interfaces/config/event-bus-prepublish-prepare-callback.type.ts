import { IBaseEvent } from '../events';

export type EventBusPrepublishPrepareCallbackType<
  T extends IBaseEvent,
  K extends IBaseEvent = T
> = (events: T[]) => Promise<K[]>;
