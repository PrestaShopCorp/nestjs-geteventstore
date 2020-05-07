import {ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
import { EventStore } from '../event-store.class';

export interface IHttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: {
    username: string;
    password: string;
  }
  tcpConnectionName?: string,
  tcp?: TcpEndPoint
  http?: IHttpEndpoint
  options?: ConnectionSettings
  onTcpConnected?: (eventStore: EventStore) => void
  onTcpDisconnected?: (eventStore: EventStore) => void
}
