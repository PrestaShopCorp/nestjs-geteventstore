import {
  EventStoreAcknowledgeableEvent,
  EventVersion,
} from 'nestjs-geteventstore';

// This is the second version of this event
@EventVersion(2)
export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent {
  public declare readonly data: {
    heroId: string;
    dragonId: string;
  };
}
