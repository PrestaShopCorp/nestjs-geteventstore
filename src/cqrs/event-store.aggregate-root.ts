import { AggregateRoot } from '@nestjs/cqrs';
import { ExpectedVersion } from '..';

export abstract class EventStoreAggregateRoot extends AggregateRoot {
  // @ts-ignore
  // FIXME wait until publishAll is fixed (not used in nest CQRS)
  async commit(
    streamName: string,
    expectedRevision: ExpectedVersion = null,
  ): Promise<any>;
}
