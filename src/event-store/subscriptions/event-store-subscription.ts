import { Position } from '../connector/interface/position';

export default interface EventStoreSubscription {
  readonly isSubscribedToAll: boolean;
  readonly streamId: string;
  readonly lastCommitPosition: Position;
  readonly lastEventNumber: Long;

  close(): void;

  unsubscribe(): void;
}
