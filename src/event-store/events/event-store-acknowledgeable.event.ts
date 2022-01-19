import { IAcknowledgeableEvent } from '../../interfaces';
import { PersistentSubscriptionNakEventAction } from '../../interfaces/events/persistent-subscription-nak-event-action.enum';
import { EventStoreEvent } from './index';

export abstract class EventStoreAcknowledgeableEvent
  extends EventStoreEvent
  implements IAcknowledgeableEvent
{
  ack() {
    return Promise.resolve();
  }
  nack(action: PersistentSubscriptionNakEventAction, reason: string) {
    return Promise.resolve();
  }
}
