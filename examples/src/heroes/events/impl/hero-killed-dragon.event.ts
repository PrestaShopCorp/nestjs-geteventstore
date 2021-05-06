import { EventStoreAcknowledgeableEvent } from '../../../../../src';

export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent {
  public declare readonly data: {
    heroId: string;
    dragonId: string;
  };
}
