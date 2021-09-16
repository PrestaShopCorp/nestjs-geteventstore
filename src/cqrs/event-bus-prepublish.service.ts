import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import {
  EventBusPrepublishPrepareCallbackType,
  IBaseEvent,
  IEventBusPrepublishConfig,
  IEventBusPrepublishPrepareProvider,
  IEventBusPrepublishValidateProvider,
} from '../interfaces';

@Injectable()
export class EventBusPrepublishService<
  EventBase extends IBaseEvent = IBaseEvent,
> {
  constructor(private readonly moduleRef: ModuleRef) {}

  private async getProvider<
    T =
      | IEventBusPrepublishPrepareProvider<EventBase>
      | IEventBusPrepublishValidateProvider<EventBase>,
  >(name): Promise<T> {
    try {
      return await this.moduleRef.resolve(name);
    } catch (e) {
      return undefined;
    }
  }

  async validate<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): Promise<Error[]> {
    const { validate } = config;
    if (!validate) {
      return [];
    }
    const validator =
      (await this.getProvider<IEventBusPrepublishValidateProvider<T>>(
        validate,
      )) ?? (validate as IEventBusPrepublishValidateProvider<T>);
    const validated = await validator.validate(events);
    // validation passed without errors
    if (!validated.length) {
      return [];
    }
    // validation failed
    if (validator.onValidationFail) {
      await validator.onValidationFail(events, validated);
    }
    return validated;
  }

  async prepare<T extends EventBase = EventBase>(
    config: IEventBusPrepublishConfig<T>,
    events: T[],
  ): Promise<T[]> {
    const { prepare } = config;
    if (!prepare) {
      return events;
    }
    const provider = await this.getProvider<
      IEventBusPrepublishPrepareProvider<T>
    >(prepare);
    return provider
      ? provider.prepare(events)
      : (prepare as EventBusPrepublishPrepareCallbackType<T>)(events);
  }
}
