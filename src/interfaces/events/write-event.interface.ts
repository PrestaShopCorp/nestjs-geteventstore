import { IEvent } from '@nestjs/cqrs';
import { EventMetadataDto } from '../../dto';

type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
export interface IWriteEvent extends IEvent {
  data: any;
  metadata: PartialExcept<EventMetadataDto, 'correlation_id' | 'time'>;
  eventId?: string;
}
