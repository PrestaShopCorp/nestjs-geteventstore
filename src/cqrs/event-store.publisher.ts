import { Injectable, Logger } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { EventStoreBus, ExpectedVersion, EventStoreAggregateRoot, EventStore } from '..';
import { EventStoreTransaction } from 'node-eventstore-client';

export interface Constructor<T> {
  new(...args: any[]): T;
}

@Injectable()
// @ts-ignore
export class EventStorePublisher {
  public readonly logger = new Logger('EventStorePublisher')
  constructor(private readonly eventBus: EventStoreBus, private readonly eventStore: EventStore) {
  }

  mergeClassContext<T extends Constructor<EventStoreAggregateRoot>>(metatype: T): T {
    const eventBus = this.eventBus;
    const eventStore = this.eventStore;
    return class extends metatype {
      publish(event: IEvent) {
        eventBus.publish(event);
      }
      commit() {
        if (this.streamConfig) {
          eventBus.publishAll(this.getUncommittedEvents(), this.streamConfig);
        } else {
          this.getUncommittedEvents().forEach(event => this.publish(event));
        }
        this.uncommit();
      }
      async setStreamMetadata(streamMetadata, expectedStreamMetadataVersion: number = ExpectedVersion.Any) {
        return await eventStore.connection.setStreamMetadataRaw(
          this.streamConfig.streamName,
          expectedStreamMetadataVersion,
          streamMetadata,
        );
      }
      async startTransaction(expectedVersion: number = ExpectedVersion.Any) : Promise<EventStoreTransaction> {
        return await eventStore.connection.startTransaction(this.streamConfig.streamName, expectedVersion);
      }
      async continueTransaction(transaction: EventStoreTransaction) : Promise<EventStoreTransaction> {
        return eventStore.connection.continueTransaction(transaction.transactionId);
      }

    };
  }

  mergeObjectContext<T extends EventStoreAggregateRoot>(object: T): T {
    const logger = this.logger;
    const eventBus = this.eventBus;
    const eventStore = this.eventStore;

    object.commit = () => {
      if (object.streamConfig) {
        eventBus.publishAll(object.getUncommittedEvents(), object.streamConfig);
      } else {
        object.getUncommittedEvents().forEach(event => object.publish(event));
      }
      object.uncommit();
    };
    object.publish = (event: IEvent) => {
      eventBus.publish(event);
    };
    object.setStreamMetadata = async (streamMetadata, expectedStreamMetadataVersion: number = ExpectedVersion.Any) => {
      logger.debug(`Set stream metadata for ${object.streamConfig.streamName}`);
      return await eventStore.connection.setStreamMetadataRaw(
        object.streamConfig.streamName,
        expectedStreamMetadataVersion,
        streamMetadata,
      );
    }
    object.startTransaction = async (expectedVersion: number = ExpectedVersion.Any) : Promise<EventStoreTransaction> => {
      return await eventStore.connection.startTransaction(object.streamConfig.streamName, expectedVersion);
    }
    object.continueTransaction = async (transaction: EventStoreTransaction) : Promise<EventStoreTransaction> => {
      return eventStore.connection.continueTransaction(transaction.transactionId);
    }
    return object;
  }
}