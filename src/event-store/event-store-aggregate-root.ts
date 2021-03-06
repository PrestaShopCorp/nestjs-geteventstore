import { AggregateRoot as Parent } from '../cqrs';
import { ExpectedVersion } from '../enum';
import { IBaseEvent, PublicationContextInterface } from '../interfaces';

export abstract class EventStoreAggregateRoot<
  EventBase extends IBaseEvent = IBaseEvent
> extends Parent<EventBase> {
  private _streamName?: string;
  private _streamMetadata?: any;

  set streamName(streamName: string) {
    this._streamName = streamName;
  }

  set streamMetadata(streamMetadata) {
    this._streamMetadata = streamMetadata;
  }

  set maxAge(maxAge) {
    this._streamMetadata = {
      ...this._streamMetadata,
      $maxAge: maxAge,
    };
  }

  set maxCount(maxCount) {
    this._streamMetadata = {
      ...this._streamMetadata,
      $maxCount: maxCount,
    };
  }

  async commit(
    expectedVersion: ExpectedVersion = ExpectedVersion.Any,
    expectedMetadataVersion: ExpectedVersion = ExpectedVersion.Any,
  ) {
    this.logger.debug(
      `Aggregate will commit ${this.getUncommittedEvents().length} events in ${
        this.publishers.length
      } publishers`,
    );
    const context: PublicationContextInterface = {
      expectedVersion,
      ...(this._streamName ? { streamName: this._streamName } : {}),
      ...(this._streamMetadata
        ? { streamMetadata: this._streamMetadata, expectedMetadataVersion }
        : {}),
    };
    for (const publisher of this.publishers) {
      await publisher(this.getUncommittedEvents(), context);
    }
    this.clearEvents();
    return this;
  }
}
