import { ExpectedRevisionType } from '../../event-store/events';

export interface PublicationContextInterface {
  streamName?: string;
  expectedVersion?: ExpectedRevisionType;
  streamMetadata?: any;
  expectedMetadataVersion?: ExpectedRevisionType;
}
