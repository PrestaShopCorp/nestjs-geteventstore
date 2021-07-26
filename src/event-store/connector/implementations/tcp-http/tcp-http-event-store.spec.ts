import { TcpHttpEventStore } from './tcp-http-event-store';
import TcpHttpEventStoreConfig from '../../../config/tcp-http/tcp-http-event-store.config';
import spyOn = jest.spyOn;

describe('TcpHttpEventStore', () => {
  const config: TcpHttpEventStoreConfig = {
    tcpConnectionName: 'titi',
    http: {
      port: 6666,
      host: 'https://hostname.com/',
    },
    credentials: {
      username: 'toto',
      password: 'tutu',
    },
  };

  let store: TcpHttpEventStore;

  beforeEach(() => {
    store = getTcpStore(config);
  });

  describe('When creating', () => {
    it('should be given a http client with tcp conf', () => {
      store = getTcpStore(config);
      expect(store.HTTPClient).toBeTruthy();
    });
    it('should be given a http client with dns cluster conf', () => {
      store = getClusterDnsStore(config);
      expect(store.HTTPClient).toBeTruthy();
    });
  });

  it('should store the connection when created', async () => {
    expect(store.connection).not.toBeUndefined();
  });

  it('should connect to the store when connecting', async () => {
    jest.spyOn(store.connection, 'connect').mockImplementation(() => null);
    await store.connect();

    expect(store.connection.connect).toHaveBeenCalled();
  });

  describe('Connection events management', () => {
    beforeEach(async () => {
      config.onTcpConnected = jest.fn();
      config.onTcpDisconnected = jest.fn();
      store = getTcpStore(config);
      await store.connect();
    });

    describe('On connection open event', () => {
      beforeEach(async () => {
        // @ts-ignore
        store.connection.emit('connected');
      });

      it('should save the connection state', async () => {
        expect(store.isConnected()).toBeTruthy();
      });

      it('should run tcp connection callBack', async () => {
        expect(config.onTcpConnected).toHaveBeenCalledWith(store);
      });
    });

    describe('On connection close event', () => {
      beforeEach(async () => {
        // @ts-ignore
        store.connection.emit('closed');
      });

      it('should save the connection state', async () => {
        expect(store.isConnected()).toBeFalsy();
      });

      it('should run tcp disconnection callBack', async () => {
        expect(config.onTcpDisconnected).toHaveBeenCalledWith(store);
      });
    });

    it('should close connection when trigger close action', () => {
      spyOn(store.connection, 'close');
      store.disconnect();
      expect(store.connection.close).toHaveBeenCalled();
    });
  });
});

const getTcpStore = (config: TcpHttpEventStoreConfig) => {
  return new TcpHttpEventStore({
    ...config,
    tcp: { port: 6666, host: 'https://hostname.com/' },
  });
};

const getClusterDnsStore = (config: TcpHttpEventStoreConfig) => {
  return new TcpHttpEventStore({
    ...config,
    clusterDns: 'tcp://hostname:6666',
  });
};
