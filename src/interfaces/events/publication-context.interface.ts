import { StreamMetadata } from '@eventstore/db-client/dist/utils/streamMetadata';
import { SetStreamMetadataOptions } from '@eventstore/db-client/dist/streams';
import { AppendExpectedRevision } from '@eventstore/db-client/dist/types';

export interface PublicationContextInterface {
  streamName?: string;
  expectedRevision?: AppendExpectedRevision;
  streamMetadata?: StreamMetadata;
  options?: SetStreamMetadataOptions;
}
