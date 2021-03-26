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

  commit(expectedVersion: ExpectedVersion = ExpectedVersion.Any) {
    this.publishers.forEach((publisher) => {
      publisher(this.getUncommittedEvents(), expectedVersion, this._streamName);
    });
    this.clearEvents();
    return this;
  }
}
