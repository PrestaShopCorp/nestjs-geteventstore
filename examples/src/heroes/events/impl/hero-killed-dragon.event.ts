import { ExpectedVersion, IAggregateEvent } from '../../../../../src';

export class HeroKilledDragonEvent implements IAggregateEvent {

  constructor(
    public readonly data: {
      heroId: string,
      dragonId: string
    }) {
  }

  get streamName() {
    return `hero-${this.data.heroId}`;
  }
  get metadata() {
    return {
      version: 1,
      created_at: new Date(),
    };
  }
  get expectedVersion() {return ExpectedVersion.NoStream}
}
