import { v4 } from 'uuid';
import { WriteEventDto } from '../../dto/write-event.dto';
import { EventOptionsType, IReadEvent, IWriteEvent } from '../../interfaces';

export abstract class EventStoreEvent
  extends WriteEventDto
  implements IWriteEvent, IReadEvent
{
  // just for read events
  public readonly eventStreamId: IReadEvent['eventStreamId'] | undefined;
  public readonly eventNumber: IReadEvent['eventNumber'] | undefined;
  public readonly originalEventId: IReadEvent['originalEventId'] | undefined;

  constructor(public data: any, options?: EventOptionsType) {
    super();
    // metadata is added automatically in write events, so we cast to any
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
