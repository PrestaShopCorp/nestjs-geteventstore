import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import {
  EventBusPrepublishPrepareCallbackType,
  IBaseEvent,
  IEventBusPrepublishConfig,
  IEventBusPrepublishPrepareProvider,
  IEventBusPrepublishValidateProvider,
} from '../interfaces';

@Injectable()
export class EventBusPrepublishService<
  EventBase extends IBaseEvent = IBaseEvent
> {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly moduleRef: ModuleRef) {}

  private async getProvider<
    T =
      | IEventBusPrepublishPrepareProvider<EventBase>
      | IEventBusPrepublishValidateProvider<EventBase>
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
  ): Promise<boolean> {
    const { validate } = config;
    if (!validate) {
      return true;
    }
    this.logger.debug('validating events...');
    const validator =
      (await this.getProvider<IEventBusPrepublishValidateProvider<T>>(
        validate,
      )) ?? (validate as IEventBusPrepublishValidateProvider<T>);
    const validated = await validator.validate(events);
    // validation passed without errors
    if (!validated.length) {
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
    this.logger.debug('preparing events...');
    const provider = await this.getProvider<
      IEventBusPrepublishPrepareProvider<T>
    >(prepare);
    return !!provider
      ? provider.prepare(events)
      : (prepare as EventBusPrepublishPrepareCallbackType<T>)(events);
  }
}
