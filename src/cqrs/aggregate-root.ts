import { Logger } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import { InvalidPublisherException } from '../exceptions/invalid-publisher.exception';

const INTERNAL_EVENTS = Symbol();
const IS_AUTO_COMMIT_ENABLED = Symbol();

export abstract class AggregateRoot<EventBase extends IEvent = IEvent> {
  protected logger = new Logger(this.constructor.name);
  public [IS_AUTO_COMMIT_ENABLED] = false;
  private readonly [INTERNAL_EVENTS]: EventBase[] = [];
  private readonly _publishers: Function[] = [];

  set autoCommit(value: boolean) {
    this[IS_AUTO_COMMIT_ENABLED] = value;
  }

  get autoCommit(): boolean {
    return this[IS_AUTO_COMMIT_ENABLED];
  }

  addPublisher<T extends Function | object = Function>(
    publisher: T,
    method: keyof T = 'publishAll' as keyof T,
  ) {
    const objectPublisher = publisher?.[method];
    const addedPublisher =
      !!objectPublisher && typeof objectPublisher === 'function'
        ? objectPublisher.bind(publisher)
        : publisher;
    if (typeof addedPublisher === 'function') {
      this._publishers.push(addedPublisher);
      return this;
    }
    throw new InvalidPublisherException(publisher, method);
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

  async commit() {
    this.logger.debug(
      `Aggregate will commit ${this.getUncommittedEvents().length} in ${
        this.publishers.length
      } publishers`,
    );

    // flush the queue first to avoid multiple commit of the same event on concurrent calls
    const events = this.getUncommittedEvents();
    this.clearEvents();

    // publish the event
    for (const publisher of this.publishers) {
      await publisher(events).catch((error) => {
        this[INTERNAL_EVENTS].unshift(...events);
        throw error;
      });
    }
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

  async apply<T extends EventBase = EventBase>(
    event: T,
    isFromHistory = false,
  ) {
    this.logger.debug(
      `Applying ${event.constructor.name} with${
        !!this.autoCommit ? '' : 'out'
      } autocommit`,
    );
    if (!isFromHistory) {
      this.addEvent(event);
    }
    this.autoCommit && (await this.commit());
    const handler = this.getEventHandler(event);
    handler && (await handler.call(this, event));
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
