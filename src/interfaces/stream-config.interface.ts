import { ExpectedVersion } from './event.interface';

export interface IStreamConfig {
  // Optional generated with domain_methodName-eventId  in payload || uuidv4
  // accessible in projection with $ce-order_create
  streamName?: string,
  // Default any, in which state the stream should be when writing
  expectedVersion?: ExpectedVersion,
  metadata?: IStreamMetadata
}
export interface IStreamMetadata {
  // Optional Retention rules default keep for long time
  $maxAge?: number,
  $maxCount?: number,
  // Optional role access on event store
  permissions?: ['$admin'],
}