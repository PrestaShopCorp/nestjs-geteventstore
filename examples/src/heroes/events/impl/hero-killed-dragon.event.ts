import {
  AcknowledgeableEventStoreEvent,
  ExpectedVersion,
  IExpectedVersionEvent,
} from '../../../../../src';

export class HeroKilledDragonEvent extends AcknowledgeableEventStoreEvent
  implements IExpectedVersionEvent {

  constructor(
    public readonly data: {
      heroId: string,
      dragonId: string
    }, options?) {
    super(data, options);
  }

  get eventStreamId() {
    return `hero-${this.data.heroId}`;
  }

  get expectedVersion() {
    return ExpectedVersion.NoStream;
  }
}
