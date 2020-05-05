import { EventStoreEvent, ExpectedVersion, IExpectedVersionEvent } from '../../../../../src';

export class HeroFoundItemEvent extends EventStoreEvent
  implements IExpectedVersionEvent {
  constructor(
    public readonly data: {
      heroId: string,
      itemId: string
    }, options?) {
    super(data, options);
  }

  get eventStreamId(): string {
    return `hero-${this.data.heroId}`;
  }

  get expectedVersion() {
    return ExpectedVersion.EmptyStream;
  }
}
