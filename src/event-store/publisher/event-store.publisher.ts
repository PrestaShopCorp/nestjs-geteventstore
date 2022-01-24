import { jsonEvent } from '@eventstore/db-client';
import * as constants from '@eventstore/db-client/dist/constants';
import { AppendResult } from '@eventstore/db-client/dist/types';
import { EventData } from '@eventstore/db-client/dist/types/events';
import { Inject, Logger } from '@nestjs/common';
import { IEventPublisher } from '@nestjs/cqrs';
import { hostname } from 'os';
import { basename, extname } from 'path';
import {
  IWriteEvent,
  IWriteEventBusConfig,
  PublicationContextInterface,
} from '../../interfaces';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '../services/event-store.service.interface';

export class EventStorePublisher<EventBase extends IWriteEvent = IWriteEvent>
  implements IEventPublisher<EventBase>
{
  private logger: Logger = new Logger(this.constructor.name);

  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
    private readonly config: IWriteEventBusConfig,
  ) {}

  private async writeEvents<T extends EventBase>(
    events: T[],
    context: PublicationContextInterface = {},
  ): Promise<AppendResult> {
    const {
      streamName = context?.streamName ||
        this.getStreamName(events[0].metadata.correlation_id),
      expectedRevision,
      streamMetadata,
      options,
    } = context;
    if (streamMetadata) {
      await this.eventStoreService.writeMetadata(
        streamName,
        streamMetadata,
        options,
      );
    }
    const eventCount = events.length;
    this.logger.debug(
      `Write ${eventCount} events to stream ${streamName} with expectedVersion ${expectedRevision}`,
    );
    return this.eventStoreService.writeEvents(
      streamName,
      events.map((event: T): EventData => {
        return jsonEvent({
          id: event.eventId,
          type: event.eventType,
          metadata: event.metadata,
          data: event.data,
        });
      }),
      {
        expectedRevision: expectedRevision ?? constants.ANY,
      },
    );
  }

  protected getStreamName(
    correlationId: EventBase['metadata']['correlation_id'],
  ): string {
    const defaultName = process.argv?.[1]
      ? basename(process.argv?.[1], extname(process.argv?.[1]))
      : `${hostname()}_${process.argv?.[0] || 'unknown'}`;

    return `${this.config.serviceName || defaultName}-${correlationId}`;
  }

  async publish<T extends EventBase>(
    event: T,
    context?: PublicationContextInterface,
  ): Promise<AppendResult> {
    return this.publishAll([event], context);
  }

  async publishAll<T extends EventBase>(
    events: T[],
    context?: PublicationContextInterface,
  ): Promise<AppendResult> {
    return await this.writeEvents(events, context);
  }
}
