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

@Injectable()
export class ReadEventBus<
  EventBase extends IReadEvent = IReadEvent
> extends Parent<EventBase> {
  constructor(
    @Inject(READ_EVENT_BUS_CONFIG)
    private readonly config: ReadEventBusConfigType,
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
  publish<T extends EventBase>(event: T) {
    // TODO jdm optional validator from moduleRef (through config)
    return super.publish(event);
  }
  publishAll<T extends EventBase>(events: T[]) {
    // TODO jdm optional validator from moduleRef (through config)
    return super.publishAll(events);
  }
  map<T extends EventBase>(data: any, options: ReadEventOptionsType): T {
    const eventMapper =
      this.config.eventMapper || defaultEventMapper(this.config.allowedEvents);
    return eventMapper(data, options) as T;
  }
}
