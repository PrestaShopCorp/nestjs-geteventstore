import { ExpectedVersion } from '../../event-store';
import { IWriteEvent } from './write-event.interface';

export interface IReadEvent extends IWriteEvent {
  eventStreamId?: string;
  expectedVersion?: ExpectedVersion;
  getStream(): string;
}
