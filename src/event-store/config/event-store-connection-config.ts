import { ChannelCredentialOptions } from '@eventstore/db-client/dist/Client';
import { Credentials } from '@eventstore/db-client/dist/types';
import Connector from './connector';

export interface EventStoreConnectionConfig {
  connectionSettings: Connector;
  channelCredentials?: ChannelCredentialOptions;
  defaultUserCredentials?: Credentials;
}
