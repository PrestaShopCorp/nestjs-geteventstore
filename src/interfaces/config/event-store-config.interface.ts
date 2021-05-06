import { UserCredentials } from 'geteventstore-promise';
import { ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
import { EventStore } from '../../event-store';

export interface IHttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: UserCredentials;
  tcpConnectionName?: string;
  tcp?: TcpEndPoint;
  http?: IHttpEndpoint;
  clusterDns?: string;
  options?: ConnectionSettings;
  onTcpConnected?: (eventStore: EventStore) => void;
  onTcpDisconnected?: (eventStore: EventStore) => void;
}
