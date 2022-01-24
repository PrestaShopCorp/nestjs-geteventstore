import { IEvent } from '@nestjs/cqrs';
import { ContextName } from 'nestjs-context';
import { Observable } from 'rxjs';
import { EventStorePublisher } from '../../event-store';
import { IWriteEvent } from '../events';
import { IEventBusPrepublishConfig } from './event-bus-prepublish-config.interface';

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
