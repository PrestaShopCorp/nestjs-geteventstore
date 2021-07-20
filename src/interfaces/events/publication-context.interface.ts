import { ExpectedVersion } from '../../enum';

export interface PublicationContextInterface {
  streamName?: string;
  expectedVersion?: ExpectedVersion;
  streamMetadata?: any;
  expectedMetadataVersion?: ExpectedVersion;
}
