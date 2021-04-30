import { IBaseEvent } from '../events';

export type EventBusPrepublishPrepareType<
  T extends IBaseEvent,
  K extends IBaseEvent = T
> = (events: T[]) => Promise<K[]>;
