import { EventStoreProjection } from '../../interfaces';
import { IPersistentSubscriptionConfig } from '../subscriptions';

export interface IEventStoreSubsystems {
  projections?: EventStoreProjection[];
  subscriptions?: {
    persistent?: IPersistentSubscriptionConfig[];
  };
  onEvent?: (sub, payload) => void;
  onConnectionFail?: (err: Error) => void;
}
