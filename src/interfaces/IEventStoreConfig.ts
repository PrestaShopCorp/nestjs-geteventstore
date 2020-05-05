import {ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';

export interface HttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: {
    username: string;
    password: string;
  }
  tcp: TcpEndPoint
  http: HttpEndpoint
  options: ConnectionSettings
}
