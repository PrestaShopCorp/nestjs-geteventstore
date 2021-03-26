import { IEvent, IEventBus } from '@nestjs/cqrs';

const INTERNAL_EVENTS = Symbol();
const IS_AUTO_COMMIT_ENABLED = Symbol();

type PublisherType<T> = Function | T;

export abstract class AggregateRoot<
  EventBase extends IEvent = IEvent,
  EventBusBase extends IEventBus<EventBase> = IEventBus<EventBase>,
  PublisherBase extends PublisherType<EventBusBase> = PublisherType<EventBusBase>
> {
  public [IS_AUTO_COMMIT_ENABLED] = false;
  private readonly [INTERNAL_EVENTS]: EventBase[] = [];
  private readonly _publishers: PublisherType<EventBusBase>[] = [];

  set autoCommit(value: boolean) {
    this[IS_AUTO_COMMIT_ENABLED] = value;
  }

  get autoCommit(): boolean {
    return this[IS_AUTO_COMMIT_ENABLED];
  }

  addPublisher<
    T extends EventBase = EventBase,
    K extends EventBusBase = EventBusBase
  >(publisher: PublisherType<K>) {
    this._publishers.push(publisher);
    return this;
  }

  get publishers() {
    return this._publishers;
  }

  protected addEvent<T extends EventBase = EventBase>(event: T) {
    this[INTERNAL_EVENTS].push(event);
    return this;
  }

  protected clearEvents() {
    this[INTERNAL_EVENTS].length = 0;
    return this;
  }

  commit() {
    this.publishers.forEach((publisher) => {
      if (typeof publisher === 'function') {
        publisher(this.getUncommittedEvents());
      } else {
        publisher.publishAll(this.getUncommittedEvents());
      }
    });
    this.clearEvents();
    return this;
  }

  uncommit() {
    this.clearEvents();
    return this;
  }

  getUncommittedEvents(): EventBase[] {
    return this[INTERNAL_EVENTS];
  }

  loadFromHistory(history: EventBase[]) {
    history.forEach((event) => this.apply(event, true));
  }

  apply<T extends EventBase = EventBase>(event: T, isFromHistory = false) {
    if (!isFromHistory) {
      this.addEvent(event);
    }
    this.autoCommit && this.commit();
    const handler = this.getEventHandler(event);
    handler && handler.call(this, event);
  }

  private getEventHandler<T extends EventBase = EventBase>(
    event: T,
  ): Function | undefined {
    const handler = `on${this.getEventName(event)}`;
    return this[handler];
  }

  private getEventName(event: any): string {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name as string;
  }
}
