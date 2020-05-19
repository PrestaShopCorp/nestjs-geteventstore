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

  getStream() {
    return `hero-${this.data.heroId}`;
  }
}
