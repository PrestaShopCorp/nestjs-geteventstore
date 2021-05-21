import { v4 } from 'uuid';

import { EventOptionsType, IReadEvent, IWriteEvent } from '../interfaces';
import { WriteEventDto } from '../dto/write-event.dto';

export abstract class EventStoreEvent
  extends WriteEventDto
  implements IWriteEvent, IReadEvent {
  // just for read events
  public readonly eventStreamId: IReadEvent['eventStreamId'] | undefined;
  public readonly eventNumber: IReadEvent['eventNumber'] | undefined;
  public readonly originalEventId: IReadEvent['originalEventId'] | undefined;

  constructor(public data: any, options?: EventOptionsType) {
    super();
    this.metadata = options?.metadata || ({} as any); // any = read, write will be validated
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
