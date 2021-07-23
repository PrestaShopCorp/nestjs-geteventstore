import {UserCredentials} from 'geteventstore-promise';
import {ConnectionSettings, TcpEndPoint} from 'node-eventstore-client';
import EventStoreConnector from '../../connector/interface/event-store-connector';
import {IEventStoreConfig} from '../event-store-config.interface';

export interface IHttpEndpoint extends TcpEndPoint {}

export default interface TcpHttpEventStoreConfig extends IEventStoreConfig{
    credentials: UserCredentials;
    tcpConnectionName: string;
    tcp?: TcpEndPoint;
    http: IHttpEndpoint;
    clusterDns?: string;
    options?: ConnectionSettings;
    onTcpConnected?: (eventStore: EventStoreConnector) => void;
    onTcpDisconnected?: (eventStore: EventStoreConnector) => void;

}
