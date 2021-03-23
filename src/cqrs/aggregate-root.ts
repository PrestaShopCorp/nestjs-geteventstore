import { IEvent, IEventBus } from '@nestjs/cqrs';

const INTERNAL_EVENTS = Symbol();
const IS_AUTO_COMMIT_ENABLED = Symbol();

export abstract class AggregateRoot<
  EventBase extends IEvent = IEvent,
  EventBusBase extends IEventBus<EventBase> = IEventBus<EventBase>
  > {
  public [IS_AUTO_COMMIT_ENABLED] = false;
  private readonly [INTERNAL_EVENTS]: EventBase[] = [];
  private readonly _publishers: EventBusBase[];

  set autoCommit(value: boolean) {
    this[IS_AUTO_COMMIT_ENABLED] = value;
  }

  get autoCommit(): boolean {
    return this[IS_AUTO_COMMIT_ENABLED];
  }

  addPublisher(subscriber: EventBusBase) {
    this._publishers.push(subscriber);
    return this;
  }

  get publishers(): EventBusBase[] {
    return this._publishers;
  }

  protected addEvent<T extends EventBase = EventBase>(event: T) {
    this[INTERNAL_EVENTS].push(event);
  }

  protected clearEvents() {
    this[INTERNAL_EVENTS].length = 0;
  }

  commit() {
    this.publishers.forEach((publisher) =>
      publisher.publishAll(this.getUncommittedEvents()),
    );
    this.clearEvents();
  }

  uncommit() {
    this.clearEvents();
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

  protected getEventHandler<T extends EventBase = EventBase>(
    event: T,
  ): Function | undefined {
    const handler = `on${this.getEventName(event)}`;
    return this[handler];
  }

  protected getEventName(event: any): string {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name as string;
  }
}
