import InMemoryEventsAndMetadatasStacker from './in-memory-events-and-metadatas-stacker';
import EventBatch from '../../interface/event-batch';
import { EventData } from '@eventstore/db-client/dist/types/events';
import MetadatasContextDatas from '../../interface/metadatas-context-datas';
import { AppendToStreamOptions } from '@eventstore/db-client/dist/streams';
import { ANY } from '@eventstore/db-client';

describe('InMemoryEventsAndMetadatasStacker', () => {
  let service: InMemoryEventsAndMetadatasStacker;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new InMemoryEventsAndMetadatasStacker();
  });

  describe('when stacking events', () => {
    it('should be able to add a new element at the end of the fifo', () => {
      let event: EventData = getDumbEvent('1');
      let events: EventData[] = [event];
      let stream = 'poj';
      let expectedVersion: AppendToStreamOptions = { expectedRevision: ANY };
      const batch1: EventBatch = {
        events,
        stream,
        expectedVersion,
      };
      event = getDumbEvent('2');
      events = [event];
      stream = 'poj';
      expectedVersion = { expectedRevision: ANY };
      const batch2 = {
        events,
        stream,
        expectedVersion,
      };

      service.putEventsInWaitingLine(batch1);
      service.putEventsInWaitingLine(batch2);

      expect(
        service.getFirstOutFromEventsBatchesWaitingLine().events[0].id,
      ).toEqual('1');
      expect(
        service.getFirstOutFromEventsBatchesWaitingLine().events[0].id,
      ).not.toEqual('2');
    });

    it('should not fail when getting first out from waiting line and line is empty', () => {
      expect(service.getFirstOutFromEventsBatchesWaitingLine()).toBeNull();
    });

    it('should be able to give the fifo length ', () => {
      const batch1: EventBatch = getDumbBatch('1', 'poj');
      const batch2: EventBatch = getDumbBatch('2', 'oiu');

      service.putEventsInWaitingLine(batch1);
      service.putEventsInWaitingLine(batch2);

      expect(service.getEventBatchesWaitingLineLength()).toEqual(2);
    });

    it('should be able to remove the first element of the waiting line', () => {
      const batch1: EventBatch = getDumbBatch('1', 'poj');
      const batch2: EventBatch = getDumbBatch('2', 'oiu');

      service.putEventsInWaitingLine(batch1);
      service.putEventsInWaitingLine(batch2);

      const unstackedBatch1: EventBatch =
        service.shiftEventsBatchFromWaitingLine();
      const unstackedBatch2: EventBatch =
        service.shiftEventsBatchFromWaitingLine();

      expect(unstackedBatch1.stream).toEqual('poj');
      expect(unstackedBatch2.stream).toEqual('oiu');
      expect(service.getEventBatchesWaitingLineLength()).toEqual(0);
    });
  });

  describe('when stacking metadatas', () => {
    it('should be able to add a new element at the end of the fifo', () => {
      const metadatasContextDatas1: MetadatasContextDatas =
        getDumbMetadata('1');
      const metadatasContextDatas2: MetadatasContextDatas =
        getDumbMetadata('2');

      service.putMetadatasInWaitingLine(metadatasContextDatas1);
      service.putMetadatasInWaitingLine(metadatasContextDatas2);

      expect(service.getFirstOutFromMetadatasWaitingLine().streamName).toEqual(
        '1',
      );
      expect(
        service.getFirstOutFromMetadatasWaitingLine().streamName,
      ).not.toEqual('2');
    });

    it('should not fail when getting first out from waiting line and line is empty', () => {
      expect(service.getFirstOutFromMetadatasWaitingLine()).toBeNull();
    });

    it('should be able to give the fifo length ', () => {
      const metadatasContextDatas1: MetadatasContextDatas =
        getDumbMetadata('1');
      const metadatasContextDatas2: MetadatasContextDatas =
        getDumbMetadata('2');

      service.putMetadatasInWaitingLine(metadatasContextDatas1);
      service.putMetadatasInWaitingLine(metadatasContextDatas2);

      expect(service.getMetadatasWaitingLineLength()).toEqual(2);
    });

    it('should be able to remove the first element of the waiting line', () => {
      const metadatasContextDatas1: MetadatasContextDatas =
        getDumbMetadata('1');
      const metadatasContextDatas2: MetadatasContextDatas =
        getDumbMetadata('2');

      service.putMetadatasInWaitingLine(metadatasContextDatas1);
      service.putMetadatasInWaitingLine(metadatasContextDatas2);

      const metadataGot1 = service.shiftMetadatasFromWaitingLine();
      const metadataGot2 = service.shiftMetadatasFromWaitingLine();

      expect(metadataGot1.streamName).toEqual('1');
      expect(metadataGot2.streamName).toEqual('2');
      expect(service.getEventBatchesWaitingLineLength()).toEqual(0);
    });
  });
});

function getDumbBatch(eventId: string, stream: string): EventBatch {
  const events: EventData[] = [getDumbEvent(eventId)];
  const expectedVersion: AppendToStreamOptions = { expectedRevision: ANY };
  return {
    events,
    stream,
    expectedVersion,
  };
}

const getDumbEvent = (id?: string): EventData => {
  return {
    contentType: undefined,
    data: undefined,
    id: id ?? '',
    metadata: undefined,
    type: '',
  };
};
const getDumbMetadata = (streamName?: string): MetadatasContextDatas => {
  return {
    metadata: undefined,
    streamName: streamName ?? '',
  };
};
