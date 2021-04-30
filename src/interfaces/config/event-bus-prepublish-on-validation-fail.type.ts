import { IBaseEvent } from '../events';

export type EventBusPrepublishOnValidationFailType<T extends IBaseEvent> = (
  events: T[],
  errors: any[],
) => void;
