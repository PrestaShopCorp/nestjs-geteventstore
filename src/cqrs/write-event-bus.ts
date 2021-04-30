import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { EventStore, EventStorePublisher } from '../event-store';
import { IWriteEvent, IWriteEventBusConfig } from '../interfaces';
import { ExpectedVersion } from '../enum';
import { WRITE_EVENT_BUS_CONFIG } from '../constants';
import { ModuleRef } from '@nestjs/core';
import { EventBusPrepublishService } from './event-bus-prepublish.service';

// add next, pass onError

@Injectable()
export class WriteEventBus<
  EventBase extends IWriteEvent = IWriteEvent
> extends Parent<EventBase> {
  constructor(
    private readonly eventstore: EventStore,
    @Inject(WRITE_EVENT_BUS_CONFIG)
    private readonly config: IWriteEventBusConfig,
    private readonly prepublish: EventBusPrepublishService,
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
    this.publisher = new EventStorePublisher<EventBase>(
      this.eventstore,
      this.config,
    );
  }

  async publish<T extends EventBase = EventBase>(
    event: T,
    expectedVersion?: ExpectedVersion,
    streamName?: string,
  ): Promise<any> {
    const preparedEvents = await this.prepublish.prepare(this.config, [event]);
    if (!(await this.prepublish.validate(this.config, preparedEvents))) {
      return;
    }
    return await this.publisher.publish<T>(
      preparedEvents,
      // @ts-ignore
      expectedVersion,
      // @ts-ignore
      streamName,
    );
  }
  async publishAll<T extends EventBase = EventBase>(
    events: T[],
    expectedVersion?: ExpectedVersion,
    streamName?: string,
  ): Promise<any> {
    const preparedEvents = await this.prepublish.prepare(this.config, events);
    if (!(await this.prepublish.validate(this.config, preparedEvents))) {
      return;
    }
    return await this.publisher.publishAll(
      preparedEvents,
      // @ts-ignore
      expectedVersion,
      // @ts-ignore
      streamName,
    );
  }
}
