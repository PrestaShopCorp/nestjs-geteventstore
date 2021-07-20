import {
  EventStoreProjection,
  IPersistentSubscriptionConfig,
} from '../../interfaces';

export interface IEventStoreSubsystems {
  projections?: EventStoreProjection[];
  subscriptions?: {
    persistent?: IPersistentSubscriptionConfig[];
  };
  onEvent?: (sub, payload) => void;
  onConnectionFail?: (err: Error) => void;
}
