import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { EventStore, EventStorePublisher } from '../event-store';
import { IWriteEvent, IWriteEventBusConfig } from '../interfaces';
import { ExpectedVersion } from '../enum';
import { CQRS_EVENT_STORE_CONFIG } from '../constants';
import { ModuleRef } from '@nestjs/core';

// add next, pass onError

@Injectable()
export class WriteEventBus<
  EventBase extends IWriteEvent = IWriteEvent
> extends Parent<EventBase> {
  constructor(
    readonly eventstore: EventStore,
    @Inject(CQRS_EVENT_STORE_CONFIG)
    readonly config: IWriteEventBusConfig,
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
    this.publisher = new EventStorePublisher(eventstore, config);
  }
  async publish<T extends EventBase>(
    event: T,
    expectedVersion?: ExpectedVersion,
    streamName?: string,
  ): Promise<any> {
    // TODO jdm optional validator from moduleRef (through config)
    // @ts-ignore
    return await this.publisher.publish(event, expectedVersion, streamName);
  }
  async publishAll<T extends EventBase>(
    events: T[],
    expectedVersion?: ExpectedVersion,
    streamName?: string,
  ): Promise<any> {
    // TODO jdm optional validator from moduleRef (through config)
    return await this.publisher.publishAll(
      events,
      // @ts-ignore
      expectedVersion,
      // @ts-ignore
      streamName,
    );
  }
}
