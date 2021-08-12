import { IReadEvent } from './read-event.interface';
import { PersistentSubscriptionNakEventAction } from './persistent-subscription-nak-event-action.enum';

export interface IAcknowledgeableEvent extends IReadEvent {
  ack: () => Promise<any>;
  nack: (
    action: PersistentSubscriptionNakEventAction,
    reason: string,
  ) => Promise<any>;
}
