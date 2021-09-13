import IEventsAndMetadatasStacker from '../../interface/events-and-metadatas-stacker';
import EventBatch from '../../interface/event-batch';
import MetadatasContextDatas from '../../interface/metadatas-context-datas';

export default class InMemoryEventsAndMetadatasStacker
  implements IEventsAndMetadatasStacker
{
  private eventBatchesFifo: EventBatch[] = [];

  private metadatasFifo: MetadatasContextDatas[] = [];

  public shiftEventsBatchFromWaitingLine(): EventBatch {
    return this.eventBatchesFifo.shift();
  }

  public getFirstOutFromEventsBatchesWaitingLine(): EventBatch {
    if (this.eventBatchesFifo.length === 0) {
      return null;
    }
    return this.eventBatchesFifo[0];
  }

  public putEventsInWaitingLine(batch: EventBatch): void {
    this.eventBatchesFifo.push(batch);
  }

  public getEventBatchesWaitingLineLength(): number {
    return this.eventBatchesFifo.length;
  }

  public shiftMetadatasFromWaitingLine(): MetadatasContextDatas {
    return this.metadatasFifo.shift();
  }

  public getFirstOutFromMetadatasWaitingLine(): MetadatasContextDatas {
    if (this.metadatasFifo.length === 0) {
      return null;
    }
    return this.metadatasFifo[0];
  }

  public getMetadatasWaitingLineLength(): number {
    return this.metadatasFifo.length;
  }

  public putMetadatasInWaitingLine(metadata: MetadatasContextDatas): void {
    this.metadatasFifo.push(metadata);
  }
}
