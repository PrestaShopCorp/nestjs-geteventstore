import { v4 } from 'uuid';

import {
  IBaseEvent,
  EventOptionsType,
  IReadEvent,
  IWriteEvent,
} from '../interfaces';

export abstract class EventStoreEvent implements IWriteEvent, IReadEvent {
  // read and write events
  public metadata: IBaseEvent['metadata'];
  public readonly eventId: IBaseEvent['eventId'];
  public readonly eventType: IBaseEvent['eventType'];

  // just for read events
  public readonly eventStreamId: IReadEvent['eventStreamId'] | undefined;
  public readonly eventNumber: IReadEvent['eventNumber'] | undefined;
  public readonly originalEventId: IReadEvent['originalEventId'] | undefined;

  protected constructor(public readonly data: any, options?: EventOptionsType) {
    this.metadata = options?.metadata || {};
    this.eventId = options?.eventId || v4();
    this.eventType = options?.eventType || this.constructor.name;

    this.eventStreamId = options?.eventStreamId ?? undefined;
    this.eventNumber = options?.eventNumber ?? undefined;
    this.originalEventId = options?.originalEventId ?? undefined;
  }

  // Notice we force this helpers to return strings
  // to keep string typing (!undefined) on our subscriptions
  getStream(): string {
    return this.eventStreamId || '';
  }
  getStreamCategory(): string {
    return this.eventStreamId?.split('-')[0] ?? '';
  }
  getStreamId(): string {
    return this.eventStreamId?.replace(/^[^-]*-/, '') ?? '';
  }
}
