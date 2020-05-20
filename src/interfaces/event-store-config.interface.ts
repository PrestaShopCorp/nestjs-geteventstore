import { ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
import { EventStore } from '../event-store.class';
import { UserCredentials } from 'geteventstore-promise';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { IEventStoreBusConfig } from './event-store-bus-config.interface';

export interface IHttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: UserCredentials;
  tcpConnectionName?: string;
  tcp?: TcpEndPoint;
  http?: IHttpEndpoint;
  options?: ConnectionSettings;
  onTcpConnected?: (eventStore: EventStore) => void;
  onTcpDisconnected?: (eventStore: EventStore) => void;
}

export interface EventStoreModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<IEventStoreConfig> | IEventStoreConfig;
  inject?: any[];
}
