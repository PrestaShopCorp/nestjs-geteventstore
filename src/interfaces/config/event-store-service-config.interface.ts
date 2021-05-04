import { EventStoreProjectionType } from '../../interfaces';
import {
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from '../subscriptions';

export interface IEventStoreServiceConfig {
  projections?: EventStoreProjectionType[];
  subscriptions?: {
    catchup?: ICatchupSubscriptionConfig[];
    volatile?: IVolatileSubscriptionConfig[];
    persistent?: IPersistentSubscriptionConfig[];
  };
  onEvent?: (sub, payload) => void;
}
