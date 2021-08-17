import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import ESEvent from './es-event';
import { v4 } from 'uuid';
import { Client } from '@eventstore/db-client/dist/Client';
import { EVENT_STORE_CONNECTOR } from '../repositories/hotel.event-store.repository';
import { jsonEvent } from '@eventstore/db-client';
import { JSONEventData } from '@eventstore/db-client/dist/types';

@Injectable()
export default class ESEventBus<
  EventType extends ESEvent = ESEvent,
> extends EventBus<ESEvent> {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStoreConnector: Client,
  ) {
    super(commandBus, moduleRef);
  }

  public async publish<EventType extends ESEvent>(
    event: EventType,
  ): Promise<void> {
    const formattedEvent: JSONEventData = jsonEvent({
      data: {
        event: event,
      },
      type: event.constructor.name,
      id: v4(),
    });

    this.logger.debug(`formattedEvent : ${JSON.stringify(formattedEvent)}`);

    await this.eventStoreConnector.appendToStream(
      event.context.streamName ?? 'no-stream',
      [formattedEvent],
    );
    return super.publish(event);
  }
}
