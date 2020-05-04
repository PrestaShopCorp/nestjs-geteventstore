import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { IEvent } from '@nestjs/cqrs';

export type TEventStoreEvent = {
  data: {},
  metadata: {},
  eventStreamId: string,
  eventId?: string,
  created?: Date,
  eventNumber?: number,
  eventType?: string,
  originalEventId?: string,
};

export type TAcknowledgeEventStoreEvent = TEventStoreEvent & {
  ack: () => {},
  nack: (action: PersistentSubscriptionNakEventAction, reason: string) => {}
}


export class EventStoreEvent implements IEvent {
  data;
  metadata;
  eventId;
  eventType;
  eventStreamId;
  created;
  eventNumber;
  /**
   * If event is resolved u
   */
  protected originalEventId;

  constructor(args: TEventStoreEvent) {
    this.data = args.data;
    this.metadata = args.metadata;
    this.eventId = args.eventId;
    this.eventType = args.eventType ? args.eventType : this.constructor.name.substr(0, -5);
    this.eventStreamId = args.eventStreamId;
    this.created = args.created;
    this.eventNumber = args.eventNumber;
    this.originalEventId = args.originalEventId;
  }

  getEventId() {
    return this.eventId;
  }

  getEventType() {
    return this.eventType;
  }

  getStream() {
    return this.eventStreamId;
  }

  getStreamCategory() {
    return this.eventStreamId.split('-')[0];
  }

  getStreamId() {
    return this.eventStreamId.replace(/^[^-]*-/, '');
  }
}

export class AcknowledgeEventStoreEvent extends EventStoreEvent {
  ack;
  nack;

  constructor(args: TAcknowledgeEventStoreEvent) {
    super(args);
    this.ack = args.ack;
    this.nack = args.nack;
  }
}