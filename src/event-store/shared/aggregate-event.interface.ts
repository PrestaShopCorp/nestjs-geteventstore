import { IEvent } from '@nestjs/cqrs';
import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { TAcknowledgeEventStoreEvent } from '../..';

export interface IAggregateEvent extends IEvent {
  streamName: string;
  data: any;
  metadata?: any;
  id?: string;
  expectedVersion?: number | ExpectedVersion;
}

export interface IAcknowledgeableAggregateEvent {
  ack: () => Promise<any>,
  nack: (action: PersistentSubscriptionNakEventAction, reason: string) => Promise<any>,
}
export class AcknowledgeableEvent implements IAcknowledgeableAggregateEvent {
  constructor() {
  }
  public ack = () => Promise.resolve()
  public nack = (action: PersistentSubscriptionNakEventAction, reason: string) => Promise.resolve()

}
// SEE https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
// https://eventstore.com/docs/dotnet-api/optimistic-concurrency-and-idempotence/index.html
export enum ExpectedVersion {
  // the stream or a metadata stream should exist when writing
  StreamExists = -4,
  // Disables the optimistic concurrency check.
  Any = -2,
  // the stream should not exist when writing.
  NoStream = -1,
  // the stream should exist but be empty when writing.
  EmptyStream = 0,
}
