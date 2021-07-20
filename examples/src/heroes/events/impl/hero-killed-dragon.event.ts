import { EventVersion } from '@nestjs-geteventstore/decorators/event-version.decorator';
import { EventStoreAcknowledgeableEvent } from '@nestjs-geteventstore/event-store/events';

// This is the second version of this event
@EventVersion(2)
export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent {
  public declare readonly data: {
    heroId: string;
    dragonId: string;
  };
}
