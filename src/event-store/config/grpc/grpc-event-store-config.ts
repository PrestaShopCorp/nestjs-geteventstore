import {Credentials} from '@eventstore/db-client/dist/types';
import {ChannelCredentialOptions} from '@eventstore/db-client/dist/Client';
import Connector from './connector';
import {IEventStoreConfig} from '../event-store-config.interface';

export interface GrpcEventStoreConfig extends IEventStoreConfig {
    connectionSettings: Connector;
    channelCredentials?: ChannelCredentialOptions;
    defaultUserCredentials?: Credentials;
}
