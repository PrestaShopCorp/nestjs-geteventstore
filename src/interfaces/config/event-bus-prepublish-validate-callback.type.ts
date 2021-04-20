import { IBaseEvent } from '../events';

export type EventBusPrepublishValidateCallbackType<
  T extends IBaseEvent,
  K extends Error = Error
> = (events: T[]) => boolean | K;
