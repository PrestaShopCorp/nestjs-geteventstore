import { AggregateRoot as Parent } from '../cqrs';
import { IBaseEvent, PublicationContextInterface } from '../interfaces';
import * as constants from '@eventstore/db-client/dist/constants';
import { AppendExpectedRevision } from '@eventstore/db-client/dist/types';
import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';

export abstract class EventStoreAggregateRoot<
  EventBase extends IBaseEvent = IBaseEvent,
> extends Parent<EventBase> {
  private _streamName?: string;
  private _streamMetadata?: StreamMetadata;

  set streamName(streamName: string) {
    this._streamName = streamName;
  }

  set streamMetadata(streamMetadata: StreamMetadata) {
    this._streamMetadata = streamMetadata;
  }

  set maxAge(maxAge: number) {
    this._streamMetadata = {
      ...this._streamMetadata,
      $maxAge: maxAge,
    };
  }

  set maxCount(maxCount: number) {
    this._streamMetadata = {
      ...this._streamMetadata,
      $maxCount: maxCount,
    };
  }

  public async commit(
    expectedRevision: AppendExpectedRevision = constants.ANY,
    expectedMetadataRevision: AppendExpectedRevision = constants.ANY,
  ) {
    this.logger.debug(
      `Aggregate will commit ${this.getUncommittedEvents().length} events in ${
        this.publishers.length
      } publishers`,
    );
    const context: PublicationContextInterface = {
      expectedRevision,
      ...(this._streamName ? { streamName: this._streamName } : {}),
      ...(this._streamMetadata
        ? { streamMetadata: this._streamMetadata, expectedMetadataRevision }
        : {}),
    };
    for (const publisher of this.publishers) {
      await publisher(this.getUncommittedEvents(), context);
    }
    this.clearEvents();
    return this;
  }
}
