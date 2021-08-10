import { EventMetadataDto } from '../../dto';

export interface IBaseEvent {
  data: any;
  metadata?: Partial<EventMetadataDto>;
  eventId?: string;
  eventType?: string;
}
