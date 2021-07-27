import { IStreamMetadata } from './stream-metadata.interface';
import { ExpectedRevisionType } from '../../event-store/events';

export interface IStreamConfig {
  // Optional generated with domain_methodName-eventId  in payload || uuidv4
  // accessible in projection with $ce-order_create
  streamName?: string;
  // Default any, in which state the stream should be when writing
  expectedVersion?: ExpectedRevisionType;
  metadata?: IStreamMetadata;
}
