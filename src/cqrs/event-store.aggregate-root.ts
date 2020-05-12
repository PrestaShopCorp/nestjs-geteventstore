import { AggregateRoot } from '@nestjs/cqrs';
import { ExpectedVersion, IStreamConfig, IStreamMetadata } from '..';
import { EventStoreTransaction, WriteResult } from 'node-eventstore-client';

export abstract class EventStoreAggregateRoot extends AggregateRoot {
  public streamConfig: IStreamConfig;

  async setStreamConfig(streamConfig: IStreamConfig) {
    this.streamConfig = streamConfig;
    if (streamConfig.metadata) {
      await this.setStreamMetadata(streamConfig.metadata);
    }
  }

  async setStreamMetadata(metadata: IStreamMetadata): Promise<WriteResult> {
    // TODO log if not replaced
    return;
  }

  async startTransaction(
    expectedVersion: number = ExpectedVersion.Any,
  ): Promise<EventStoreTransaction> {
    // TODO log if not replaced
    return;
  }

  async continueTransaction(
    transaction: EventStoreTransaction,
  ): Promise<EventStoreTransaction> {
    // TODO log if not replaced
    return;
  }
}
