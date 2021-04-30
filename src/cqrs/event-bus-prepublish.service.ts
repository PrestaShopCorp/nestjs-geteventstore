import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import {
  EventBusPrepublishPrepareType,
  IBaseEvent,
  IEventBusPrepublishConfig,
  IEventBusPrepublishPrepareProvider,
  IEventBusPrepublishValidateProvider,
} from '../interfaces';

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

  async validate<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): Promise<boolean> {
    const { validate } = config;
    if (!validate) {
      return true;
    }
    const validator =
      this.getProvider<IEventBusPrepublishValidateProvider<T>>(validate) ??
      validate;
    const validated = await validator.validate(events);
    // validation passed without errors
    if (!!validated.length) {
      return true;
    }
    // validation failed
    if (validator.onValidationFail) {
      await validator.onValidationFail(events, validated);
    }
    return false;
  }

  async prepare<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): Promise<T[]> {
    const { prepare } = config;
    if (!prepare) {
      return events;
    }
    const provider = this.getProvider<IEventBusPrepublishPrepareProvider<T>>(
      prepare,
    );
    return !!provider
      ? provider.prepare(events)
      : (prepare as EventBusPrepublishPrepareType<T>)(events);
  }
}
