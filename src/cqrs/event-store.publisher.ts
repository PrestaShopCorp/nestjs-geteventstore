import { Injectable } from '@nestjs/common';
import {
  EventStore,
  EventStoreAggregateRoot,
  EventStoreBus,
  ExpectedVersion,
  IStreamConfig,
} from '..';
import { IEvent } from '@nestjs/cqrs';

export interface Constructor<T> {
  new (...args: any[]): T;
}

@Injectable()
// FIXME wait until publishAll is fixed (not used in nest CQRS)
export class EventStorePublisher {
  constructor(
    private readonly eventBus: EventStoreBus,
    private readonly eventStore: EventStore,
  ) {}
  async setStreamMetadata(streamConfig: IStreamConfig) {
    await this.eventStore.connection.setStreamMetadataRaw(
      streamConfig.streamName,
      ExpectedVersion.Any,
      streamConfig.metadata,
    );
  }
  mergeClassContext<T extends Constructor<EventStoreAggregateRoot>>(
    metatype: T,
  ): T {
    const eventStore = this.eventStore;
    return class extends metatype {
      async commit(stream: string, expectedRevision: ExpectedVersion = null) {
        await eventStore.writeEvents(
          stream,
          this.getUncommittedEvents(),
          expectedRevision,
        );
        this.uncommit();
      }
    };
  }

  mergeObjectContext<T extends EventStoreAggregateRoot<IEvent>>(object: T): T {
    const eventStore = this.eventStore;

    object.commit = async (
      stream: string,
      expectedRevision: ExpectedVersion = null,
    ) => {
      await eventStore.writeEvents(
        stream,
        object.getUncommittedEvents(),
        expectedRevision,
      );
      object.uncommit();
    };
  }
}
