import { EventStoreAcknowledgeableEvent } from '../../../../../src';

export class HeroDropItemEvent extends EventStoreAcknowledgeableEvent {
  constructor(
    public readonly data: {
      heroId: string;
      itemId: string;
    },
    options?,
  ) {
    super(data, options);
  }
}
