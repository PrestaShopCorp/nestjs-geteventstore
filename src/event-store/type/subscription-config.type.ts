import {
  ICatchupSubscriptionConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from '../interfaces';

export type SubscriptionConfigType =
  | IPersistentSubscriptionConfig
  | ICatchupSubscriptionConfig
  | IVolatileSubscriptionConfig;
