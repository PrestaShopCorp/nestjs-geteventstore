import { IBaseEvent } from '../events';

export type EventBusPrepublishPrepareCallbackType<T extends IBaseEvent> = (
  events: T[],
) => T[];
