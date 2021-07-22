import {EventStorePublisher} from './event-store.publisher';
import {IWriteEvent, IWriteEventBusConfig} from '../interfaces';
import {EventStore} from './event-store';
import {of} from 'rxjs';
import {ExpectedVersion} from '../enum';
import spyOn = jest.spyOn;
import {EventStoreService} from './event-store.service';

jest.mock('./event-store');

describe('EventStorePublisher', () => {
    let publisher: EventStorePublisher;

    const eventStoreMock = EventStore as jest.MockedClass<typeof EventStore>;
    let eventStore: EventStore;
    let eventStoreService: EventStoreService;
    let publisherConfig: IWriteEventBusConfig;

    beforeEach(() => {
        eventStoreMock.mockClear();

        publisherConfig = {};
        eventStore = new EventStore({
                                        credentials: undefined,
                                        http: undefined,
                                        tcpConnectionName: ''
                                    });
        eventStoreService = new EventStoreService(eventStore, {});
        publisher = new EventStorePublisher<IWriteEvent>(eventStoreService, publisherConfig);
    });

    it('should be instanciated properly', () => {
        expect(publisher).toBeTruthy();
    });

    it('should give default context value when write events and no context given', async () => {
        eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
        await publisher.publish(
            {
                data: undefined,
                metadata: {
                    correlation_id: 'toto'
                }
            }
        );
        expect(eventStore.writeEvents).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            ExpectedVersion.Any,
        );
    });

    it('should write metadatas when metadata stream is given', async () => {
        eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
        spyOn(eventStore, 'writeMetadata');
        let streamName = 'streamName';
        let expectedVersion = 999;
        let streamMetadata = 'dumbMetadata';
        let expectedMetadataVersion = 888;
        await publisher.publish(
            {
                data: undefined,
                metadata: {
                    correlation_id: 'toto'
                }
            },
            {
                streamName: streamName,
                expectedVersion: expectedVersion,
                streamMetadata: streamMetadata,
                expectedMetadataVersion: expectedMetadataVersion
            }
        );
        expect(eventStore.writeMetadata).toHaveBeenCalledWith(
            streamName,
            expectedMetadataVersion,
            streamMetadata
        );
    });

    it('should publish single event the same way than multiple events when only 1 event is ', async () => {
        eventStore.writeEvents = jest.fn().mockReturnValue(of({}));
        spyOn(publisher, 'publishAll');
        await publisher.publish(
            {
                data: undefined,
                metadata: {
                    correlation_id: 'toto'
                }
            }
        );
        expect(publisher.publishAll).toHaveBeenCalled();
    });
});
