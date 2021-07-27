import { EventStorePublisher } from './event-store.publisher';
import { IWriteEvent, IWriteEventBusConfig } from '../../interfaces';
import { TcpHttpEventStore } from '../connector/implementations/tcp-http/tcp-http-event-store';
import { of } from 'rxjs';
import spyOn = jest.spyOn;
import { EventStoreService } from '../event-store.service';
import { ExpectedRevision, ExpectedRevisionType } from '../events';

jest.mock('../connector/implementations/tcp-http/tcp-http-event-store');

describe('EventStorePublisher', () => {
  let publisher: EventStorePublisher;

  let eventStore: TcpHttpEventStore;
  let eventStoreService: EventStoreService;
  let publisherConfig: IWriteEventBusConfig;

  beforeEach(() => {
    publisherConfig = {};
    eventStore = new TcpHttpEventStore({
      credentials: undefined,
      http: undefined,
      tcpConnectionName: '',
    });
    eventStoreService = new EventStoreService(eventStore, {});
    publisher = new EventStorePublisher<IWriteEvent>(
      eventStoreService,
      publisherConfig,
    );
  });

  it('should be instanciated properly', () => {
    expect(publisher).toBeTruthy();
  });

  it('should give default context value when write events and no context given', async () => {
    eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
    await publisher.publish({
      data: undefined,
      metadata: {
        correlation_id: 'toto',
      },
    });
    expect(eventStore.writeEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ExpectedRevision.Any,
    );
  });

  it('should write metadatas when metadata stream is given', async () => {
    eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
    spyOn(eventStore, 'writeMetadata');
    const streamName = 'streamName';
    const expectedRevision: ExpectedRevisionType = ExpectedRevision.Any;
    const streamMetadata = 'dumbMetadata';
    const expectedMetadataVersion = 888;
    await publisher.publish(
      {
        data: undefined,
        metadata: {
          correlation_id: 'toto',
        },
      },
      {
        streamName: streamName,
        expectedVersion: expectedRevision,
        streamMetadata: streamMetadata,
        expectedMetadataVersion: expectedMetadataVersion,
      },
    );
    expect(eventStore.writeMetadata).toHaveBeenCalledWith(
      streamName,
      expectedMetadataVersion,
      streamMetadata,
    );
  });

  it('should publish single event the same way than multiple events when only 1 event is ', async () => {
    eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
    spyOn(publisher, 'publishAll');
    await publisher.publish({
      data: undefined,
      metadata: {
        correlation_id: 'toto',
      },
    });
    expect(publisher.publishAll).toHaveBeenCalled();
  });
});