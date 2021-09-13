import { SetStreamMetadataOptions } from '@eventstore/db-client/dist/streams';
import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';

export default interface MetadatasContextDatas {
  streamName: string;
  metadata: StreamMetadata;
  options?: SetStreamMetadataOptions;
}
