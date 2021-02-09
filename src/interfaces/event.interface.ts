import { IEvent } from '@nestjs/cqrs';
import { v4 } from 'uuid';
import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';

// SEE https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
// https://eventstore.com/docs/dotnet-api/optimistic-concurrency-and-idempotence/index.html
export enum ExpectedVersion {
  // the stream or a metadata stream should exist when writing
  StreamExists = -4,
  // Disables the optimistic concurrency check.
  Any = -2,
  // the stream should not exist when writing.
  NoStream = -1,
  // the stream should exist but be empty when writing.
  EmptyStream = 0,
}

export interface IAggregateEvent extends IEvent {
  data: any;
  eventStreamId?: string;
  metadata?: any;
  eventId?: string;
  expectedVersion?: number | ExpectedVersion;
  getStream(): string;
}

export interface IExpectedVersionEvent {
  expectedVersion: number | ExpectedVersion;
}

export interface IEventStoreEventOptions {
  eventStreamId?: string;
  metadata?: any;
  eventId?: string;
  created?: Date;
  eventNumber?: number;
  eventType?: string;
  originalEventId?: string;
  expectedVersion?: number | ExpectedVersion;
}

export abstract class EventStoreEvent implements IAggregateEvent {
  public metadata?: any;
  public readonly eventId?: string;
  public readonly eventType?: string;
  public readonly created?: Date;
  public readonly eventNumber: number;
  /**
   * If event is resolved u
   */
  protected readonly originalEventId: string;
  readonly eventStreamId: string;

  protected constructor(
    public readonly data: any,
    options: IEventStoreEventOptions = {},
  ) {
    this.metadata = {
      ...{
        created_at: new Date(),
        version: 1,
      },
      ...(options.metadata || {}),
    };
    this.eventId = options.eventId || v4();
    this.eventType = options.eventType || this.constructor.name;
    this.created = options.created;
    this.eventNumber = options.eventNumber;
    this.originalEventId = options.originalEventId;
    this.eventStreamId = options.eventStreamId;
  }

  getStream(): string {
    return this.eventStreamId;
  }

  getStreamCategory() {
    return this.eventStreamId.split('-')[0];
  }

  getStreamId() {
    return this.eventStreamId.replace(/^[^-]*-/, '');
  }
}

export interface IAcknowledgeableEvent {
  ack: () => Promise<any>;
  nack: (
    action: PersistentSubscriptionNakEventAction,
    reason: string,
  ) => Promise<any>;
}

export abstract class AcknowledgeableEventStoreEvent
  extends EventStoreEvent
  implements IAcknowledgeableEvent {
  ack() {
    return Promise.resolve();
  }

  nack(action: PersistentSubscriptionNakEventAction, reason: string) {
    return Promise.resolve();
  }
}
