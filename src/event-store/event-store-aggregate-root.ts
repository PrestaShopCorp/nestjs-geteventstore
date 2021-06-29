import { AggregateRoot as Parent } from '../cqrs';
import { ExpectedVersion } from '../enum';
import { IBaseEvent } from '../interfaces';

export abstract class EventStoreAggregateRoot<
  EventBase extends IBaseEvent = IBaseEvent
> extends Parent<EventBase> {
  private _streamName?: string;

  set streamName(streamName: string) {
    this._streamName = streamName;
  }

  async commit(expectedVersion: ExpectedVersion = ExpectedVersion.Any) {
    this.logger.debug(
      `Aggregate will commit ${this.getUncommittedEvents().length} events in ${
        this.publishers.length
      } publishers`,
    );
    for (const publisher of this.publishers) {
      await publisher(
        this.getUncommittedEvents(),
        expectedVersion,
        this._streamName,
      );
    }
    this.clearEvents();
    return this;
  }
}
