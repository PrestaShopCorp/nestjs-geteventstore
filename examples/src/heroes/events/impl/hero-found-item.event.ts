import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { EventStoreEvent } from '../../../../../src';
import { Type } from 'class-transformer';

class DataType {
  @IsNumber()
  heroId: number;

  @IsString()
  itemId: string;
}

export class HeroFoundItemEvent extends EventStoreEvent<DataType> {
  @ValidateNested()
  @Type(() => DataType)
  public declare readonly data: DataType;

  constructor(data: DataType, options?) {
    super(data, options);
  }
}
