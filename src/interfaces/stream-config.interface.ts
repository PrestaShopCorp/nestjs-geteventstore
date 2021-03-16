import { ExpectedVersion } from './event.interface';

export interface IStreamConfig {
  // Optional generated with domain_methodName-eventId  in payload || uuidv4
  // accessible in projection with $ce-order_create
  streamName?: string;
  // Default any, in which state the stream should be when writing
  expectedVersion?: ExpectedVersion;
  metadata?: IStreamMetadata;
}

export interface IStreamMetadata {
  // Retention rules default keep for long time
  $maxAge?: number;
  $maxCount?: number;
  // Role access for the stream
  permissions?: ['$admin'];
  // If permission are written bug or ignore
  expectedStreamMetadataRevision?: number;
}
