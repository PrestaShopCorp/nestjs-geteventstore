import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private logger = new Logger(this.constructor.name);
  constructor(
    private readonly eventstore: EventStore,
    @Inject(WRITE_EVENT_BUS_CONFIG)
    private readonly config: IWriteEventBusConfig,
    private readonly prepublish: EventBusPrepublishService,
    commandBus: CommandBus,
    moduleRef: ModuleRef,
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
    this.logger.debug(`preparing ${events.length} events`);
    const preparedEvents = await this.prepublish.prepare(this.config, events);
    this.logger.debug(`validating ${preparedEvents.length} events`);
    if (!(await this.prepublish.validate(this.config, preparedEvents))) {
      return;
    }
    this.logger.debug(`prepared && validated ${preparedEvents.length} events`);
    return await this.publisher.publishAll(
      preparedEvents,
      // @ts-ignore
      expectedVersion,
      // @ts-ignore
      streamName,
    );
  }
}
