import {
  ICatchupSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from '../../../interfaces';
import { IPersistentSubscriptionsService } from './persistent-subscriptions.interface';
import { IStreamService } from './streams.interface';
import { IProjectionService } from './projection.interface';

export const EVENT_STORE_SERVICE = Symbol();

export interface IEventStoreService
  extends IPersistentSubscriptionsService,
    IStreamService,
    IProjectionService {
  connect(): Promise<void>;

  subscribeToCatchUpSubscriptions(
    subscriptions: ICatchupSubscriptionConfig[],
  ): Promise<unknown>;

  subscribeToVolatileSubscriptions(
    subscriptions: IVolatileSubscriptionConfig[],
  ): Promise<unknown>;
}
