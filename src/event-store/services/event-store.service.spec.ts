import { EventStoreService } from './event-store.service';
import EventStoreConnector from '../connector/interface/event-store-connector';
import { IEventStoreServiceConfig } from '../config';
import { IEventHandler } from './event.handler.interface';

describe('EventStoreService', () => {
  let service: EventStoreService;

  const eventStoreConnectorMock = {
    disconnect: jest.fn(),
    connect: jest.fn(),
  };

  let eventStoreServiceConfig: IEventStoreServiceConfig = {};
  const eventHandlerMock: IEventHandler = { onEvent: jest.fn() };

  beforeEach(() => {
    service = new EventStoreService(
      eventStoreConnectorMock as unknown as EventStoreConnector,
      eventStoreServiceConfig,
      eventHandlerMock,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should disconnect eventStore at module destroy', () => {
    spyOn(eventStoreConnectorMock, 'disconnect');

    service.onModuleDestroy();

    expect(eventStoreConnectorMock.disconnect).toHaveBeenCalled();
  });

  it('should trigger connection while module that uses this service is initiated', () => {
    spyOn(service, 'connect');

    service.onModuleInit();

    expect(service.connect).toHaveBeenCalled();
  });

  it('should connect to the eventStore while at init', async () => {
    spyOn(eventStoreConnectorMock, 'connect');

    await service.connect();

    expect(eventStoreConnectorMock.connect).toHaveBeenCalled();
  });

  it('should assert projections at init', async () => {
    spyOn(service, 'assertProjections');

    await service.connect();

    expect(service.assertProjections).toHaveBeenCalled();
  });

  it('should subscribe to given subscriptions in conf', async () => {
    eventStoreServiceConfig = {
      subscriptions: {
        catchup: [],
        volatile: [],
        persistent: [],
      },
    };

    service = new EventStoreService(
      eventStoreConnectorMock as unknown as EventStoreConnector,
      eventStoreServiceConfig,
      eventHandlerMock,
    );

    spyOn(service, 'subscribeToCatchUpSubscriptions');
    spyOn(service, 'subscribeToVolatileSubscriptions');
    spyOn(service, 'subscribeToPersistentSubscriptions');

    await service.connect();

    expect(service.subscribeToCatchUpSubscriptions).toHaveBeenCalled();
    expect(service.subscribeToVolatileSubscriptions).toHaveBeenCalled();
    expect(service.subscribeToPersistentSubscriptions).toHaveBeenCalled();
  });
});
