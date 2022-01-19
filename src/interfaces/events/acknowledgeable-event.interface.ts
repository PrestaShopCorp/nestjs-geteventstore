import { PersistentSubscriptionNakEventAction } from './persistent-subscription-nak-event-action.enum';
import { IReadEvent } from './read-event.interface';

export interface IAcknowledgeableEvent extends IReadEvent {
  ack: () => Promise<any>;
  nack: (
    action: PersistentSubscriptionNakEventAction,
    reason: string,
  ) => Promise<any>;
}
