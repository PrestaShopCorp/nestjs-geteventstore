import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { EventStoreAcknowledgeableEvent } from '../../../../../src';
import { EventVersion } from '../../../../../src/decorators/event-version.decorator';

class DataType {
  @IsNumber()
  heroId: number;

  @IsString()
  dragonId: string;
}

// This is the second version of this event
@EventVersion(2)
export class HeroKilledDragonEvent extends EventStoreAcknowledgeableEvent<DataType> {
  @ValidateNested()
  @Type(() => DataType)
  public declare readonly data: DataType;
}
