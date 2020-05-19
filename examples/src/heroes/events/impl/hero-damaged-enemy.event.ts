import { EventStoreEvent } from '../../../../../src';

export class HeroDamagedEnemyEvent extends EventStoreEvent {
  constructor(
    public readonly data: {
      heroId: string;
      dragonId: string;
      hitPoint: number;
    },
    options?,
  ) {
    super(data, options);
  }

  getStream() {
    return `hero-${this.data.heroId}`;
  }
}
