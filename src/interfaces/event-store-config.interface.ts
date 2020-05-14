import { ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
import { EventStore } from '../event-store.class';
import { UserCredentials } from 'geteventstore-promise';

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
