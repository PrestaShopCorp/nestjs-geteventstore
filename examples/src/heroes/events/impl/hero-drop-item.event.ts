import { EventStoreEvent } from '../../../../../src';

export class HeroDropItemEvent extends EventStoreEvent {
  constructor(
    public readonly data: {
      heroId: string;
      itemId: string;
    },
    options?,
  ) {
    super(data, options);
  }

  get eventStreamId() {
    return `hero-${this.data.heroId}`;
  }
}
