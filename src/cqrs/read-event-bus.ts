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
    /**
     * @todo Bug in Nest ? We need to inject ModuleRef this way because when we try to do it with the DI container we have an error:
     *    Argument of type 'import("/nestjs-geteventstore/node_modules/@nestjs/core/injector/module-ref").ModuleRef'
     *    is not assignable to parameter of type 'import("/nestjs-geteventstore/examples/node_modules/@nestjs/core/injector/module-ref").ModuleRef'.
     *    Property 'container' is protected but type 'ModuleRef' is not a class derived from 'ModuleRef'.
     */
    @Inject(ModuleRef)
    moduleRef,
  ) {
    super(commandBus, moduleRef);
  }
  publish<T extends EventBase = EventBase>(event: T) {
    if (!this.prepublish.validate(this.config, [event])) {
      return;
    }
    return super.publish(this.prepublish.prepare(this.config, [event])[0]);
  }
  publishAll<T extends EventBase = EventBase>(events: T[]) {
    if (!this.prepublish.validate(this.config, events)) {
      return;
    }
    return super.publishAll(this.prepublish.prepare(this.config, events));
  }
  map<T extends EventBase>(data: any, options: ReadEventOptionsType): T {
    const eventMapper =
      this.config.eventMapper || defaultEventMapper(this.config.allowedEvents);
    return eventMapper(data, options) as T;
  }
}
