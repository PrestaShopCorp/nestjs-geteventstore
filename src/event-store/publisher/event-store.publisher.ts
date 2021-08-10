import { hostname } from 'os';
import { IEventPublisher } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { basename, extname } from 'path';

import {
  IWriteEvent,
  IWriteEventBusConfig,
  PublicationContextInterface,
} from '../../interfaces';
import { ExpectedRevision } from '../events';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '../services/interfaces/event-store.service.interface';
import { AppendResult } from '../connector/interface/append-result';

export class EventStorePublisher<EventBase extends IWriteEvent = IWriteEvent>
  implements IEventPublisher<EventBase>
{
  private logger: Logger = new Logger(this.constructor.name);
  // private readonly onPublishFail: IWriteEventBusConfig['onPublishFail'] = () =>
  //   empty();

  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
    private readonly config: IWriteEventBusConfig,
  ) {
    // if (config.onPublishFail) {
    //   this.onPublishFail = config.onPublishFail;
    // } // TODO manage this onPublishFail
  }

  private writeEvents<T extends EventBase>(
    events: T[],
    context: PublicationContextInterface = {},
  ): Promise<AppendResult> {
    const {
      streamName = context?.streamName ||
        this.getStreamName(events[0].metadata.correlation_id),
      expectedVersion = ExpectedRevision.Any,
      streamMetadata,
      expectedMetadataVersion = ExpectedRevision.Any,
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
