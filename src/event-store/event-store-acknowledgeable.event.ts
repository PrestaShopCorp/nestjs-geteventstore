import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { ReadEvent } from '../events';
import { IAcknowledgeableEvent } from '../interfaces';

export abstract class EventStoreAcknowledgeableEvent
  extends ReadEvent
  implements IAcknowledgeableEvent {
  ack() {
    return Promise.resolve();
  }
  nack(action: PersistentSubscriptionNakEventAction, reason: string) {
    return Promise.resolve();
  }
}
