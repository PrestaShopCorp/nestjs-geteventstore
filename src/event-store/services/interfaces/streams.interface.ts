import { IBaseEvent, IWriteEvent } from '../../../interfaces';
import { WriteResult } from 'node-eventstore-client';
import { ExpectedRevisionType } from '../../events';
import { Observable } from 'rxjs';
import { AppendResult } from '../../connector/interface/append-result';

export interface IStreamService {
  writeEvents(
    stream: string,
    events: IWriteEvent[],
    expectedVersion?,
  ): Promise<AppendResult>;

  readFromStream(
    stream: string,
    options: {
      maxCount?: number;
      fromRevision?: 'start' | 'end' | BigInt;
      resolveLinkTos?: boolean;
      direction?: 'forwards' | 'backwards';
    },
  ): Promise<IBaseEvent[]>;

  writeMetadata(
    stream: string,
    expectedStreamMetadataVersion: ExpectedRevisionType,
    streamMetadata: unknown,
  ): Observable<WriteResult | AppendResult>;

  readMetadata(stream: string): Observable<any>;
}
