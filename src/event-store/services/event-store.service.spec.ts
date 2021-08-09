import { EventStoreService } from './event-store.service';
import EventStoreConnector from '../connector/interface/event-store-connector';
import { IEventStoreServiceConfig } from '../config';
import { IEventHandler } from './event.handler.interface';

describe('EventStoreService', () => {
  let service: EventStoreService;

  const eventStoreConnectorMock = {};

  const eventStoreServiceConfig: IEventStoreServiceConfig = {};
  const eventHandlerMock: IEventHandler = { onEvent: jest.fn() };

  beforeEach(() => {
    service = new EventStoreService(
      eventStoreConnectorMock as EventStoreConnector,
      eventStoreServiceConfig,
      eventHandlerMock,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
