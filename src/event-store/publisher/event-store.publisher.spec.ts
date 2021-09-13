import { EventStorePublisher } from './event-store.publisher';
import {
  IWriteEvent,
  IWriteEventBusConfig,
  PublicationContextInterface,
} from '../../interfaces';
import { of } from 'rxjs';
import { EventStoreService } from '../services/event-store.service';
import * as constants from '@eventstore/db-client/dist/constants';
import { AppendExpectedRevision } from '@eventstore/db-client/dist/types';
import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';
import { Logger as logger } from '@nestjs/common/services/logger.service';
import InMemoryEventsAndMetadatasStacker from '../reliability/implementations/in-memory/in-memory-events-and-metadatas-stacker';
import { Client } from '@eventstore/db-client/dist/Client';
import spyOn = jest.spyOn;

describe('EventStorePublisher', () => {
  let publisher: EventStorePublisher;

  let eventStore: Client;
  let eventStoreService: EventStoreService;
  let publisherConfig: IWriteEventBusConfig;

  const eventsStackerMock: InMemoryEventsAndMetadatasStacker = {
    putEventsInWaitingLine: jest.fn(),
    shiftEventsBatchFromWaitingLine: jest.fn(),
    getFirstOutFromEventsBatchesWaitingLine: jest.fn(),
    getEventBatchesWaitingLineLength: jest.fn(),
    putMetadatasInWaitingLine: jest.fn(),
    getFirstOutFromMetadatasWaitingLine: jest.fn(),
    shiftMetadatasFromWaitingLine: jest.fn(),
    getMetadatasWaitingLineLength: jest.fn(),
  } as unknown as InMemoryEventsAndMetadatasStacker;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mock('@nestjs/common');
    jest.spyOn(logger, 'log').mockImplementation(() => null);
    jest.spyOn(logger, 'error').mockImplementation(() => null);
    jest.spyOn(logger, 'debug').mockImplementation(() => null);

    publisherConfig = {};
    eventStore = {
      appendToStream: jest.fn(),
      setStreamMetadata: jest.fn(),
    } as unknown as Client;
    eventStoreService = new EventStoreService(
      eventStore,
      {
        onConnectionFail: () => {},
      },
      eventsStackerMock,
    );
    publisher = new EventStorePublisher<IWriteEvent>(
      eventStoreService,
      publisherConfig,
    );
  });

  it('should be instanciated properly', () => {
    expect(publisher).toBeTruthy();
  });

  it('should give default context value when write events and no context given', async () => {
    spyOn(eventStore, 'appendToStream').mockImplementationOnce(() => {
      return null;
    });
    spyOn(eventStoreService, 'writeEvents');
    await eventStoreService.onModuleInit();
    await publisher.publish({
      data: undefined,
      metadata: {
        correlation_id: 'toto',
      },
    });
    expect(eventStoreService.writeEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expectedRevision: constants.ANY },
    );
  });

  it('should write metadatas when metadata stream is given', async () => {
    spyOn(eventStore, 'setStreamMetadata');
    spyOn(eventStoreService, 'writeMetadata');

    const streamName = 'streamName';
    const streamMetadata: StreamMetadata = { truncateBefore: 'start' };
    const expectedRevision: AppendExpectedRevision = constants.STREAM_EXISTS;
    const context: PublicationContextInterface = {
      streamName: streamName,
      expectedRevision: constants.ANY,
      streamMetadata,
      options: { expectedRevision },
    };

    await publisher.publish(
      {
        data: undefined,
        metadata: {
          correlation_id: 'toto',
        },
      },
      context,
    );

    expect(eventStoreService.writeMetadata).toHaveBeenCalledWith(
      streamName,
      streamMetadata,
      context.options,
    );
  });

  it('should publish single event the same way than multiple events when only 1 event is ', async () => {
    eventStore.appendToStream = jest.fn().mockReturnValue(of({}));
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
