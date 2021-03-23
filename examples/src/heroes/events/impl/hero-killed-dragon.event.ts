import { EventStoreAcknowledgeableEvent } from '../../../../../src';

export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent {
  constructor(
    public readonly data: {
      heroId: string;
      dragonId: string;
    },
    options?,
  ) {
    super(data, options);
  }
}
