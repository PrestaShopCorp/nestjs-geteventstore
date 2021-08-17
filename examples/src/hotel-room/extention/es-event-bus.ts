import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/interfaces/event-store.service.interface';
import ESEvent from './es-event';
import { v4 } from 'uuid';

@Injectable()
export default class ESEventBus<
  EventType extends ESEvent = ESEvent,
> extends EventBus<ESEvent> {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {
    super(commandBus, moduleRef);
  }

  public async publish<EventType extends ESEvent>(
    event: EventType,
  ): Promise<void> {
    const formattedEvent = {
      data: {
        value: event,
      },
      eventId: v4(),
      eventType: event.constructor.name,
    };
    this.logger.debug(`formattedEvent : ${JSON.stringify(formattedEvent)}`);
    await this.eventStoreService.writeEvents(
      event.context.streamName ?? 'no-stream',
      [formattedEvent],
    );
    return super.publish(event);
  }
}
