import { ConnectToPersistentSubscriptionOptions } from '@eventstore/db-client/dist/persistentSubscription';
import { BaseOptions } from '@eventstore/db-client/dist/types';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import { DuplexOptions } from 'stream';

export interface IPersistentSubscriptionConfig {
  stream: string;
  group: string;
  optionsForConnection?: {
    subscriptionConnectionOptions?: Partial<ConnectToPersistentSubscriptionOptions>;
    duplexOptions?: Partial<DuplexOptions>;
  };
  settingsForCreation?: {
    subscriptionSettings?: Partial<PersistentSubscriptionSettings>;
    baseOptions?: Partial<BaseOptions>;
  };

  onSubscriptionStart?: () => void | undefined;
  onSubscriptionDropped?: (reason: string, error: string) => void | undefined;
  onError?: (error: Error) => void | undefined;
}
