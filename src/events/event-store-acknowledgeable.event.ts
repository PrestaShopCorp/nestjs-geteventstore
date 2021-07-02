import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { EventStoreEvent } from './index';
import { IAcknowledgeableEvent } from '../interfaces';

export abstract class EventStoreAcknowledgeableEvent<T>
  extends EventStoreEvent<T>
  implements IAcknowledgeableEvent
{
  ack() {
    return Promise.resolve();
  }
  nack(action: PersistentSubscriptionNakEventAction, reason: string) {
    return Promise.resolve();
  }
}
