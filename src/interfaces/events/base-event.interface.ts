import { IEvent } from '@nestjs/cqrs';
import { EventMetadataDto } from '../../dto';

export interface IBaseEvent extends IEvent {
  data: any;
  metadata?: any;
  eventId?: string;
  eventType?: string;
}
