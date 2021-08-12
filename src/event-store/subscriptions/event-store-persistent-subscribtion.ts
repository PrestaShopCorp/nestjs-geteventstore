import { PersistentSubscriptionNakEventAction } from '../../interfaces/events/persistent-subscription-nak-event-action.enum';

/**
 * ResolvedEvent should be typed with :
 {
    event?: EventTypeToRecordedEvent<Event>;
    link?: EventTypeToRecordedEvent<Event>;
    commitPosition?: bigint;
 }
 or something lib specific (once updating, to be determined).
 And to be compatible with both old and new connector version,
 actually is "any" alias
*/

export type ResolvedEvent = any;

export default interface EventStorePersistentSubscription {
  acknowledge(events: ResolvedEvent | ResolvedEvent[]): void;
  fail(
    events: ResolvedEvent | ResolvedEvent[],
    action: PersistentSubscriptionNakEventAction,
    reason: string,
  ): void;
  stop(): void;
}
