import { hostname } from 'os';
import { empty } from 'rxjs';
import { IEventPublisher } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { basename, extname } from 'path';

import { ExpectedVersion } from '../../enum';
import {
  IWriteEvent,
  IWriteEventBusConfig,
  PublicationContextInterface,
} from '../../interfaces';
import { WriteResult } from 'node-eventstore-client';
import { EventStoreService } from '../event-store.service';

export class EventStorePublisher<EventBase extends IWriteEvent = IWriteEvent>
  implements IEventPublisher<EventBase>
{
  private logger: Logger = new Logger(this.constructor.name);
  private readonly onPublishFail: IWriteEventBusConfig['onPublishFail'] = () =>
    empty();

  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly config: IWriteEventBusConfig,
  ) {
    if (config.onPublishFail) {
      this.onPublishFail = config.onPublishFail;
    }
  }

  private writeEvents<T extends EventBase>(
    events: T[],
    context: PublicationContextInterface = {
      streamName: this.getStreamName(events[0].metadata.correlation_id),
    },
  ): Promise<WriteResult | void> {
    const {
      streamName,
      expectedVersion = ExpectedVersion.Any,
      streamMetadata,
      expectedMetadataVersion = ExpectedVersion.Any,
    } = context;
    if (streamMetadata) {
      this.eventStoreService.writeMetadata(
        streamName,
        expectedMetadataVersion,
        streamMetadata,
      );
    }
    const eventCount = events.length;
    this.logger.debug(
      `Write ${eventCount} events to stream ${streamName} with expectedVersion ${expectedVersion}`,
    );
    return this.eventStoreService.writeEvents(
      streamName,
      events,
      expectedVersion,
    );
    // .catch((err) => {
    //   this.onPublishFail(err, events, this);
    //   throw new Error(err);
    // });
  }

  protected getStreamName(
    correlationId: EventBase['metadata']['correlation_id'],
  ) {
    const defaultName = process.argv?.[1]
      ? basename(process.argv?.[1], extname(process.argv?.[1]))
      : `${hostname()}_${process.argv?.[0] || 'unknown'}`;

    return `${this.config.serviceName || defaultName}-${correlationId}`;
  }

  async publish<T extends EventBase>(
    event: T,
    context?: PublicationContextInterface,
  ) {
    return this.publishAll([event], context);
  }

  async publishAll<T extends EventBase>(
    events: T[],
    context?: PublicationContextInterface,
  ) {
    return await this.writeEvents(events, context);
  }
}
