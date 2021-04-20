import { ModuleRef } from '@nestjs/core';
import {
  EventBusPrepublishPrepareCallbackType,
  EventBusPrepublishValidateCallbackType,
  IBaseEvent,
  IEventBusPrepublishConfig,
  IEventBusPrepublishPrepareProvider,
  IEventBusPrepublishValidateProvider,
} from '../interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventBusPrepublishService<
  EventBase extends IBaseEvent = IBaseEvent
> {
  constructor(private readonly moduleRef: ModuleRef) {}

  private getProvider<
    T =
      | IEventBusPrepublishPrepareProvider<EventBase>
      | IEventBusPrepublishValidateProvider<EventBase>
  >(name): T {
    try {
      return this.moduleRef.get(name);
    } catch (e) {
      return undefined;
    }
  }

  validate<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): boolean {
    const { validate } = config;
    if (!validate) {
      return true;
    }
    const provider = this.getProvider<IEventBusPrepublishValidateProvider<T>>(
      validate,
    );
    const validated = !!provider
      ? provider.validate(events)
      : (validate as EventBusPrepublishValidateCallbackType<T>)(events);
    if (validated instanceof Error) {
      throw validated;
    }
    return validated;
  }
  prepare<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): T[] {
    const { prepare } = config;
    if (!prepare) {
      return events;
    }
    const provider = this.getProvider<IEventBusPrepublishPrepareProvider<T>>(
      prepare,
    );
    return !!provider
      ? provider.prepare(events)
      : (prepare as EventBusPrepublishPrepareCallbackType<T>)(events);
  }
}
