import { Injectable } from '@nestjs/common';
import {
  EventStore,
  EventStoreAggregateRoot,
  EventStoreBus,
  ExpectedVersion,
  IStreamConfig,
} from '..';
import { IEvent } from '@nestjs/cqrs';
import { EventStoreTransaction } from 'node-eventstore-client';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
// FIXME wait until publishAll is fixed (not used in nest CQRS)
export class EventStorePublisher {
  constructor(
    private readonly eventBus: EventStoreBus,
    private readonly eventStore: EventStore,
  ) {}

  /**
   * Call is mandatory before everything
   * For bounded context it's better to have one stream per command
   * crossing borders, should be done using projections
   * @todo Use a decorator ?
   * @todo streamName, streamMetadata as method signature ?
   * @param streamConfig
   */
  async setStreamConfig(streamConfig: IStreamConfig) {
    await this.eventStore.connection.setStreamMetadataRaw(
      streamConfig.streamName,
      ExpectedVersion.Any,
      streamConfig.metadata,
    );
  }

  /**
   * Could be done on service side ?
   * Goal is to start a transaction on a command handler, and finish it on another one
   * @param expectedVersion
   */
  async startTransaction(
    streamName: string,
    expectedVersion: ExpectedVersion = null,
  ): Promise<EventStoreTransaction> {
    if (streamName == null) {
      throw new Error(
        'No stream set, have you set eventStorePublisher.setStreamConfig() before commit ?',
      );
    }
    return await this.eventStore.connection.startTransaction(
      streamName,
      expectedVersion,
    );
  }
  /**
   * Could be done on service side ?
   * Transaction is started elsewhere, here I only continue it
   * @param transactionId
   */
  async continueTransaction(
    transactionId: number,
  ): Promise<EventStoreTransaction> {
    return this.eventStore.connection.continueTransaction(transactionId);
  }
  mergeClassContext<T extends Constructor<EventStoreAggregateRoot>>(
    metatype: T,
  ): T {
    const eventStore = this.eventStore;
    return class extends metatype {
      async commit(streamName, expectedRevision: ExpectedVersion = null) {
        if (streamName == null) {
          throw new Error(
            'No stream set, have you set eventStorePublisher.setStreamConfig() before commit ?',
          );
        }
        await eventStore.writeEvents(
          streamName,
          this.getUncommittedEvents(),
          expectedRevision,
        );
        this.uncommit();
      }
    };
  }

  mergeObjectContext<T extends EventStoreAggregateRoot<IEvent>>(object: T): T {
    const eventStore = this.eventStore;
    object.commit = async (
      streamName,
      expectedRevision: ExpectedVersion = null,
    ) => {
      if (streamName == null) {
        throw new Error(
          'No stream set, have you set eventStorePublisher.setStreamConfig() before commit ?',
        );
      }
      await eventStore.writeEvents(
        streamName,
        object.getUncommittedEvents(),
        expectedRevision,
      );
      object.uncommit();
    };
  }
}
