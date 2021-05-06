import { EventStoreEvent } from '../../../../../src';

export class HeroFoundItemEvent extends EventStoreEvent {
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
