import { EventStoreAcknowledgeableEvent } from '../../../../../src';
import { EventVersion } from '../../../../../src/decorators/event-version.decorator';

interface DataType {
  heroId: string;
  dragonId: string;
}

// This is the second version of this event
@EventVersion(2)
export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent<DataType> {
  public declare readonly data: DataType;
}
