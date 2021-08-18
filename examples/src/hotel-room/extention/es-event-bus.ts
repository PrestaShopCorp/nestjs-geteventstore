import { CommandBus, EventBus, IEventHandler } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { Injectable, Logger, Type } from '@nestjs/common';
import ESEvent from './es-event';
import { v4 } from 'uuid';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';
import { JSONEventData } from '@eventstore/db-client/dist/types';
import { Client } from '@eventstore/db-client/dist/Client';
import { EventStoreProjection } from './es-subsystems/projection';
import EsSubsystemConfiguration from './es-subsystems/es-subsystem.configuration';

@Injectable()
export default class ESEventBus<
  EventType extends ESEvent = ESEvent,
> extends EventBus<ESEvent> {
  private readonly logger = new Logger(this.constructor.name);
  private eventStoreConnector: Client;

  constructor(commandBus: CommandBus, moduleRef: ModuleRef) {
    super(commandBus, moduleRef);
    const connectionString =
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false';
    this.eventStoreConnector =
      EventStoreDBClient.connectionString(connectionString);
  }

  public async init(
    eventHandlers: Type<IEventHandler>[],
    esConfig: EsSubsystemConfiguration,
  ): Promise<void> {
    this.register(eventHandlers);
    Promise.all([
      esConfig.projections.map((projection: EventStoreProjection) => {
        projection.assert(this.eventStoreConnector);
      }),
    ]).then(() => this.logger.debug('EventStore initialized'));
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
