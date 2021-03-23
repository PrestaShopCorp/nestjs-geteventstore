import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  EventStore,
  EventStorePublisher,
  ExpectedVersion,
} from '../event-store';
import { IWriteEvent, IWriteEventBusConfig } from '../interfaces';

@Injectable()
export class WriteEventBus<
  EventBase extends IWriteEvent = IWriteEvent
> extends Parent<EventBase> {
  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    private readonly eventstore: EventStore,
    private readonly config: IWriteEventBusConfig,
  ) {
    super(commandBus, moduleRef);
    this.publisher = new EventStorePublisher(eventstore, config);
  }
  async publish<T extends EventBase>(
    event: T,
    expectedVersion?: ExpectedVersion,
  ): Promise<any> {
    // TODO jdm class-validator
    // @ts-ignore
    return await this.publisher.publish(event, expectedVersion);
  }
  async publishAll<T extends EventBase>(
    events: T[],
    expectedVersion?: ExpectedVersion,
    correlationId?: EventBase['metadata']['correlation_id'],
  ): Promise<any> {
    // TODO jdm class-validator
    // @ts-ignore
    return await super.publishAll(events, expectedVersion, correlationId);
  }
}
