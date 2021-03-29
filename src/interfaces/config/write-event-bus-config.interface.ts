import { IEvent } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { EventStorePublisher } from '../../event-store';
import { IEventBusPrepublishConfig } from './event-bus-prepublish-config.interface';
import { IWriteEvent } from '../events';

export interface IWriteEventBusConfig
  extends IEventBusPrepublishConfig<IWriteEvent> {
  serviceName?: string;
  // Handle publish error default do nothing
  onPublishFail?: (
    error: Error,
    events: IEvent[],
    eventStore: EventStorePublisher,
  ) => Observable<any>;
}
