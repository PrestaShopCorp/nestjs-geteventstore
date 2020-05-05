import { ExpectedVersion } from './event.interface';

export interface IStreamConfig {
  // Optional generated with domain_methodName-eventId  in payload || uuidv4
  // accessible in projection with $ce-order_create
  streamName?: string,
  // Optional Default to false
  transaction?: true,
  // Optional role access on eventstore
  permissions?: ['$admin'],
  // Default any, in which state the stream should be when writing
  expectedVersion?: ExpectedVersion,
  // Optional Retention rules default keep for long time
  maxAge?: '3d',
  maxKeep?: 10000,
}