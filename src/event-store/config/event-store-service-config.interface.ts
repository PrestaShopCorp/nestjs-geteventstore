import { EventStoreProjection } from '../../interfaces';
import {
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from '../../interfaces';

export interface IEventStoreServiceConfig {
  projections?: EventStoreProjection[];
  subscriptions?: {
    catchup?: ICatchupSubscriptionConfig[];
    volatile?: IVolatileSubscriptionConfig[];
    persistent?: IPersistentSubscriptionConfig[];
  };
  onEvent?: (sub, payload) => void;
}
