import { Injectable } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import {
  EventStore,
  EventStoreAggregateRoot,
  EventStoreBus,
  ExpectedVersion,
} from '..';
import { EventStoreTransaction } from 'node-eventstore-client';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
// @ts-ignore
export class EventStorePublisher {
  constructor(
    private readonly eventBus: EventStoreBus,
    private readonly eventStore: EventStore,
  ) {}

  mergeClassContext<T extends Constructor<EventStoreAggregateRoot>>(
    metatype: T,
  ): T {
    const eventBus = this.eventBus;
    const eventStore = this.eventStore;
    return class extends metatype {
      async publish(event: IEvent) {
        await eventBus.publish(event);
      }

      async commit() {
        if (this.streamMetadata && !this.isMetadataSet) {
          this.isMetadataSet = true;
          await this.setStreamMetadata(this.streamMetadata);
        }
        if (this.streamConfig) {
          await eventBus.publishAll(
            this.getUncommittedEvents(),
            this.streamConfig,
          );
        } else {
          this.getUncommittedEvents().forEach((event) => this.publish(event));
        }
        this.uncommit();
      }

      async setStreamMetadata(
        streamMetadata,
        expectedVersion: number = ExpectedVersion.Any,
      ) {
        return await eventStore.connection.setStreamMetadataRaw(
          this.streamConfig.streamName,
          expectedVersion,
          streamMetadata,
        );
      }

      async startTransaction(
        expectedVersion: number = ExpectedVersion.Any,
      ): Promise<EventStoreTransaction> {
        return await eventStore.connection.startTransaction(
          this.streamConfig.streamName,
          expectedVersion,
        );
      }

      async continueTransaction(
        transaction: EventStoreTransaction,
      ): Promise<EventStoreTransaction> {
        return eventStore.connection.continueTransaction(
          transaction.transactionId,
        );
      }
    };
  }

  mergeObjectContext<T extends EventStoreAggregateRoot>(object: T): T {
    const eventBus = this.eventBus;
    const eventStore = this.eventStore;

    object.commit = async () => {
      if (object.streamMetadata && !object.isMetadataSet) {
        object.isMetadataSet = true;
        await object.setStreamMetadata(object.streamMetadata);
      }
      if (object.streamConfig) {
        await eventBus.publishAll(
          object.getUncommittedEvents(),
          object.streamConfig,
        );
      } else {
        for (const event of object.getUncommittedEvents()) {
          await object.publish(event);
        }
      }
      object.uncommit();
    };
    object.publish = async (event: IEvent) => {
      await eventBus.publish(event);
    };
    object.setStreamMetadata = async (
      streamMetadata,
      expectedVersion: number = ExpectedVersion.Any,
    ) => {
      return await eventStore.connection.setStreamMetadataRaw(
        object.streamConfig.streamName,
        expectedVersion,
        streamMetadata,
      );
    };
    object.startTransaction = async (
      expectedVersion: number = ExpectedVersion.Any,
    ): Promise<EventStoreTransaction> => {
      return await eventStore.connection.startTransaction(
        object.streamConfig.streamName,
        expectedVersion,
      );
    };
    object.continueTransaction = async (
      transaction: EventStoreTransaction,
    ): Promise<EventStoreTransaction> => {
      return eventStore.connection.continueTransaction(
        transaction.transactionId,
      );
    };
    return object;
  }
}
