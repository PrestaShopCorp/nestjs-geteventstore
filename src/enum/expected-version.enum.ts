/**
 * @see https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
 * @see https://eventstore.com/docs/dotnet-api/optimistic-concurrency-and-idempotence/index.html
 */
export enum ExpectedVersion {
  // the stream or a metadata stream should exist when writing
  StreamExists = -4,
  // Disables the optimistic concurrency check.
  Any = -2,
  // the stream should not exist when writing.
  NoStream = -1,
}
