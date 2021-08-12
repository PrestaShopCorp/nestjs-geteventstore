import { RGPCEventStore } from './grpc-event-store';
import { GrpcEventStoreConfig } from '../../../config/grpc/grpc-event-store-config';
import { Client } from '@eventstore/db-client/dist/Client';
import spyOn = jest.spyOn;

describe('RGPCEventStore', () => {
  let eventStore: RGPCEventStore;

  const clientMock = Client as jest.MockedClass<typeof Client>;
  const spiedConnectToPersistentSubscription = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    // Forced to ts-ignore because jest seems to not be able to handle shared modules
    // (and db-client has a shared module with Client)
    // @ts-ignore
    spyOn(clientMock, 'connectionString').mockReturnValue({
      connectToPersistentSubscription: spiedConnectToPersistentSubscription,
    });

    const conf: GrpcEventStoreConfig = {
      connectionSettings: {
        connectionString: 'toto',
      },
    };
    eventStore = new RGPCEventStore(conf);
  });

  it('should be created', () => {
    expect(eventStore).toBeTruthy();
  });

  it('should use connection string properly', () => {
    eventStore.connect();

    expect(clientMock.connectionString).toHaveBeenCalledWith('toto');
  });

  it('should use the lib with the right options when subscribing to a persistent subscription', async () => {
    spiedConnectToPersistentSubscription.mockReturnValue({
      on: jest.fn(),
    });
    await eventStore.connect();

    eventStore.subscribeToPersistentSubscription(
      'toto',
      'tutu',
      () => null,
      true,
      500,
      null,
      null,
    );

    expect(spiedConnectToPersistentSubscription).toHaveBeenCalledWith(
      'toto',
      'tutu',
      { bufferSize: 500 },
    );
  });
});
