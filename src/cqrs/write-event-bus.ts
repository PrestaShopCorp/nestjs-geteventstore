import { CommandBus, EventBus as Parent } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventStore, EventStorePublisher } from '../event-store';
import { IWriteEvent, IWriteEventBusConfig } from '../interfaces';
import { ExpectedVersion } from '../enum';
import { WRITE_EVENT_BUS_CONFIG } from '../constants';
import { ModuleRef } from '@nestjs/core';
import { EventBusPrepublishService } from './event-bus-prepublish.service';
import { InvalidEventException } from '../exceptions/invalid-event.exception';

// add next, pass onError

@Injectable()
export class WriteEventBus<
  EventBase extends IWriteEvent = IWriteEvent,
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
    this.logger.debug('Registering Write EventBus for EventStore...');
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
    this.logger.debug('Publish in write bus');
    const preparedEvents = await this.prepublish.prepare(this.config, [event]);
    const validated = await this.prepublish.validate(
      this.config,
      preparedEvents,
    );
    if (validated.length) {
      throw new InvalidEventException(validated);
    }
    this.logger.debug(`Publishing ${event.constructor.name} in ${streamName}`);
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
    this.logger.debug('Publish all in write bus');
    const preparedEvents = await this.prepublish.prepare(this.config, events);
    const validated = await this.prepublish.validate(
      this.config,
      preparedEvents,
    );
    if (validated.length) {
      throw new InvalidEventException(validated);
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
