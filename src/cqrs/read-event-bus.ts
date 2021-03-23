import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  IMappedEventOptions,
  IReadEvent,
  IReadEventBusConfig,
} from '../interfaces';
import { defaultEventMapper } from './default-event-mapper';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class ReadEventBus<
  EventBase extends IReadEvent = IReadEvent
> extends Parent<EventBase> {
  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    private readonly config: IReadEventBusConfig,
  ) {
    super(commandBus, moduleRef);
  }
  publish<T extends EventBase>(event: T) {
    // TODO jdm class-validator
    return super.publish(event);
  }
  publishAll<T extends EventBase>(events: T[]) {
    // TODO jdm class-validator
    return super.publishAll(events);
  }
  map<T extends EventBase>(data: any, options: IMappedEventOptions): T {
    const eventMapper =
      this.config.eventMapper || defaultEventMapper(this.config.allowedEvents);
    return eventMapper(data, options) as T;
  }
}
