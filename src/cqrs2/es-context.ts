import { ExpectedRevisionType } from '../event-store/events';

export interface ESContext {
  streamName?: string;
  expectedVersion?: ExpectedRevisionType;
  streamMetadata?: any;
  expectedMetadataVersion?: ExpectedRevisionType;
}
