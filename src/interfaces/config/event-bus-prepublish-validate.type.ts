import { IBaseEvent } from '../events';

export type EventBusPrepublishValidateType<T extends IBaseEvent> = (
  events: T[],
) => Promise<any[]>;
