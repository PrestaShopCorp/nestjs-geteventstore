/**
 * @see https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
 * @see https://eventstore.com/docs/dotnet-api/optimistic-concurrency-and-idempotence/index.html
 */
import { ANY, NO_STREAM, STREAM_EXISTS } from '@eventstore/db-client';

export class ExpectedRevision {
  // the stream or a metadata stream should exist when writing
  public static readonly StreamExists: ExpectedRevisionType = STREAM_EXISTS;
  // Disables the optimistic concurrency check.
  public static readonly Any: ExpectedRevisionType = ANY;
  // the stream should not exist when writing.
  public static readonly NoStream: ExpectedRevisionType = NO_STREAM;

  // Needed to keep retro compatibility
  public static convertRevisionToVersion(
    expectedVersion: ExpectedRevisionType,
  ): number {
    switch (expectedVersion) {
      case STREAM_EXISTS:
        return -4;
      case NO_STREAM:
        return -1;
      default:
        return -2;
    }
  }
}

export type ExpectedRevisionType = string | number;
