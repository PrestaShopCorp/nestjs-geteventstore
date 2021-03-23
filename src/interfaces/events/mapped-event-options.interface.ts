import { ExpectedVersion } from '../../event-store';
import { IReadEvent } from './read-event.interface';

export interface IMappedEventOptions {
  metadata: IReadEvent['metadata'];
  eventStreamId?: IReadEvent['eventStreamId'];
  eventId?: IReadEvent['eventId'];
  eventNumber?: number;
  eventType?: string;
  originalEventId?: string;
  expectedVersion?: ExpectedVersion;
}
