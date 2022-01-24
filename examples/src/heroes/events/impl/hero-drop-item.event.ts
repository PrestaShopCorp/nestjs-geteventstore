import { EventOptionsType, EventStoreEvent } from '../../../../../src';

export class HeroDropItemEvent extends EventStoreEvent {
  constructor(
    public readonly data: {
      heroId: string;
      itemId: string;
    },
    options?: EventOptionsType,
  ) {
    super(data, options);
  }
}
