import { IStreamMetadata } from './stream-metadata.interface';
import { ExpectedVersion } from '../../enum';

export interface IStreamConfig {
  // Optional generated with domain_methodName-eventId  in payload || uuidv4
  // accessible in projection with $ce-order_create
  streamName?: string;
  // Default any, in which state the stream should be when writing
  expectedVersion?: ExpectedVersion;
  metadata?: IStreamMetadata;
}
