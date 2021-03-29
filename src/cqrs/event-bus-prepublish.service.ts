import { IBaseEvent, IEventBusPrepublishConfig } from '../interfaces';

export class EventBusPrepublishService<
  EventBase extends IBaseEvent = IBaseEvent
> {
  validate<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): boolean {
    console.log(config);
    const validated = config?.validateEvents?.(events) ?? true;
    if (validated instanceof Error) {
      throw validated;
    }
    return validated;
  }
  prepare<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): T[] {
    return config?.prepareEvents?.(events) ?? events;
  }
}
