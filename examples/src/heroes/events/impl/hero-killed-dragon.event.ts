import { ExpectedVersion, IAggregateEvent, AcknowledgeableEvent} from '../../../../../src';

export class HeroKilledDragonEvent extends AcknowledgeableEvent implements IAggregateEvent {
  constructor(
    public readonly data: {
      heroId: string,
      dragonId: string
    }) {
    super();
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
