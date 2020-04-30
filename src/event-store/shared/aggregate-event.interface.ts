import { IEvent } from '@nestjs/cqrs';

export interface IAggregateEvent extends IEvent {
  streamName: string;
  data: any;
  metadata?: any;
  id?: string;
  expectedVersion?: number|ExpectedVersion;
}
// SEE https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
// https://eventstore.com/docs/dotnet-api/optimistic-concurrency-and-idempotence/index.html
export enum ExpectedVersion {
  // the stream or a metadata stream should exist when writing
  StreamExists= -4,
  // Disables the optimistic concurrency check.
  Any= -2,
  // the stream should not exist when writing.
  NoStream= -1,
  // the stream should exist but be empty when writing.
  EmptyStream = 0,
}
