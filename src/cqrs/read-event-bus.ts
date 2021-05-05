import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  ReadEventOptionsType,
  IReadEvent,
  ReadEventBusConfigType,
} from '../interfaces';
import { defaultEventMapper } from './default-event-mapper';
import { Inject } from '@nestjs/common';
import { READ_EVENT_BUS_CONFIG } from '../constants';
import { ModuleRef } from '@nestjs/core';
import { EventBusPrepublishService } from './event-bus-prepublish.service';

@Injectable()
export class ReadEventBus<
  EventBase extends IReadEvent = IReadEvent
> extends Parent<EventBase> {
  constructor(
    @Inject(READ_EVENT_BUS_CONFIG)
    private readonly config: ReadEventBusConfigType<EventBase>,
    private readonly prepublish: EventBusPrepublishService<EventBase>,
    commandBus: CommandBus,
    moduleRef: ModuleRef,
  ) {
    super(commandBus, moduleRef);
  }
  async publish<T extends EventBase = EventBase>(event: T) {
    const preparedEvents = await this.prepublish.prepare(this.config, [event]);
    if (!(await this.prepublish.validate(this.config, preparedEvents))) {
      return;
    }
    return super.publish(preparedEvents[0]);
  }
  async publishAll<T extends EventBase = EventBase>(events: T[]) {
    const preparedEvents = await this.prepublish.prepare(this.config, events);
    if (!(await this.prepublish.validate(this.config, preparedEvents))) {
      return;
    }
    return super.publishAll(preparedEvents);
  }
  map<T extends EventBase>(data: any, options: ReadEventOptionsType): T {
    const eventMapper =
      this.config.eventMapper || defaultEventMapper(this.config.allowedEvents);
    return eventMapper(data, options) as T;
  }
}
