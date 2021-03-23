import { EventStoreProjectionType } from '../type';
import {
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from './subscriptions';

export interface IEventStoreServiceConfig {
  projections?: EventStoreProjectionType[];
  subscriptions?: {
    catchup?: ICatchupSubscriptionConfig[];
    volatile?: IVolatileSubscriptionConfig[];
    persistent?: IPersistentSubscriptionConfig[];
  };
}
