import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { EventStoreEvent } from '../../../../../src';
import { HeroDamagedEnemyDto } from '../../dto/hero-damaged-enemy.dto';

export class HeroDamagedEnemyEvent extends EventStoreEvent {
  @ValidateNested()
  @Type(() => HeroDamagedEnemyDto)
  public declare data: HeroDamagedEnemyDto;
}
