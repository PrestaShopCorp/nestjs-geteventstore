import { ExpectedRevisionType } from '@nestjs-geteventstore/event-store/events';

export interface ESContext {
  streamName?: string;
  expectedVersion?: ExpectedRevisionType;
  streamMetadata?: any;
  expectedMetadataVersion?: ExpectedRevisionType;
}
