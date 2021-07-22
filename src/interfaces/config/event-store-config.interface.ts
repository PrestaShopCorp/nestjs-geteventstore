import {UserCredentials} from 'geteventstore-promise';
import {ConnectionSettings, TcpEndPoint} from 'node-eventstore-client';
import EventStoreConnector from '../../event-store/connector/interface/event-store-connector';

export interface IHttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: UserCredentials;
  tcpConnectionName: string;
  tcp?: TcpEndPoint;
  http: IHttpEndpoint;
  clusterDns?: string;
  options?: ConnectionSettings;
  onTcpConnected?: (eventStore: EventStoreConnector) => void;
  onTcpDisconnected?: (eventStore: EventStoreConnector) => void;
}
