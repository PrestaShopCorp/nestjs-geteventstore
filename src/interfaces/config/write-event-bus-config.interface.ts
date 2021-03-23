import { IEvent } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { EventStorePublisher } from '../../event-store';

export interface IWriteEventBusConfig {
  serviceName: string;
  // Handle publish error default do nothing
  onPublishFail?: (
    error: Error,
    events: IEvent[],
    eventStore: EventStorePublisher,
  ) => Observable<any>;
}
