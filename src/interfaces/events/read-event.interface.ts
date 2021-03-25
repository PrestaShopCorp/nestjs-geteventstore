import { IBaseEvent } from './base-event.interface';

export interface IReadEvent extends IBaseEvent {
  eventStreamId: string;
  eventNumber: number;
  originalEventId: string;
  getStream(): string;
  getStreamCategory(): string;
  getStreamId(): string;
}
