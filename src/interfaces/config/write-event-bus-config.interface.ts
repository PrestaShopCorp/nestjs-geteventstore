import { IEvent } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { ContextName } from 'nestjs-context';
import { EventStorePublisher } from '../../event-store';
import { IEventBusPrepublishConfig } from './event-bus-prepublish-config.interface';
import { IWriteEvent } from '../events';

export interface IWriteEventBusConfig<T extends IWriteEvent = IWriteEvent>
  extends IEventBusPrepublishConfig<T> {
  context?: ContextName;
  serviceName?: string;
  // Handle publish error default do nothing
  onPublishFail?: (
    error: Error,
    events: IEvent[],
    eventStore: EventStorePublisher,
  ) => Observable<any>;
}
