import {ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';

export interface IHttpEndpoint extends TcpEndPoint {}

export interface IEventStoreConfig {
  credentials: {
    username: string;
    password: string;
  }
  tcp: TcpEndPoint
  http?: IHttpEndpoint
  options?: ConnectionSettings
  onConnected?: () => void
  onDisconnected?: () => void
}
