import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { IReadEvent } from './read-event.interface';

export interface IAcknowledgeableEvent extends IReadEvent {
  ack: () => Promise<any>;
  nack: (
    action: PersistentSubscriptionNakEventAction,
    reason: string,
  ) => Promise<any>;
}
