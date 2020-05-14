import { AcknowledgeableEventStoreEvent } from '../../../../../src';

export class HeroKilledDragonEvent extends AcknowledgeableEventStoreEvent {
  constructor(
    public readonly data: {
      heroId: string;
      dragonId: string;
    },
    options?,
  ) {
    super(data, options);
  }

  get eventStreamId() {
    return `hero-${this.data.heroId}`;
  }
}
