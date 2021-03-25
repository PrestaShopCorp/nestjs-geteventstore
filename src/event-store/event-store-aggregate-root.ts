import { AggregateRoot as Parent } from '../cqrs';
import { ExpectedVersion } from '../enum';
import { IWriteEvent, IWriteEventBus } from '../interfaces';

export abstract class EventStoreAggregateRoot<
  EventBase extends IWriteEvent = IWriteEvent,
  EventBusBase extends IWriteEventBus = IWriteEventBus
> extends Parent<EventBase, EventBusBase> {
  private _streamName: string;

  set streamName(streamName: string) {
    this._streamName = streamName;
  }

  commit(expectedVersion: ExpectedVersion = ExpectedVersion.Any) {
    this.publishers.forEach((publisher) =>
      publisher.publishAll(
        this.getUncommittedEvents(),
        expectedVersion,
        this._streamName,
      ),
    );
    this.clearEvents();
    return this;
  }
}
