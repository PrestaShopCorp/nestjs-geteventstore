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

  async setStreamMetadata(
    metadata: IStreamMetadata,
    expectedStreamMetadataVersion: number = ExpectedVersion.Any,
  ): Promise<WriteResult> {
    console.log('nestjs-get-eventstore::setStreamMetadata not replaced');
    return;
  }

  async startTransaction(
    expectedVersion: number = ExpectedVersion.Any,
  ): Promise<EventStoreTransaction> {
    console.log('nestjs-get-eventstore::startTransaction not replaced');
    return;
  }

  async continueTransaction(
    transaction: EventStoreTransaction,
  ): Promise<EventStoreTransaction> {
    console.log('nestjs-get-eventstore::continueTransaction not replaced');
    return;
  }

  async commit(): Promise<void> {
    return (super.commit() as unknown) as Promise<void>;
  }
}
