import EventCommitDatas from './event-commit.datas';
import MetadatasContextDatas from './metadatas-context-datas';

export const EVENT_AND_METADATAS_STACKER = Symbol();

export default interface IEventsAndMetadatasStacker {
  putEventsInWaitingLine(events: EventCommitDatas): void;

  shiftEventsBatchFromWaitingLine(): EventCommitDatas;

  getFirstOutFromEventsBatchesWaitingLine(): EventCommitDatas;

  getEventBatchesWaitingLineLength(): number;

  putMetadatasInWaitingLine(metadata: MetadatasContextDatas): void;

  getFirstOutFromMetadatasWaitingLine(): MetadatasContextDatas;

  shiftMetadatasFromWaitingLine(): MetadatasContextDatas;

  getMetadatasWaitingLineLength(): number;
}
