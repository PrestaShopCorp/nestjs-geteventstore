import { EventStoreService } from './event-store.service';
import EventStoreConnector from './connector/interface/event-store-connector';
import { IEventStoreServiceConfig } from './config';

describe('EventStoreService', () => {
  let service: EventStoreService;

  const eventStoreConnectorMock = {};

  const eventStoreServiceConfig: IEventStoreServiceConfig = {};

  beforeEach(() => {
    service = new EventStoreService(
      eventStoreConnectorMock as EventStoreConnector,
      eventStoreServiceConfig,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
