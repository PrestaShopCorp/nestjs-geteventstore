import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStoreEvent } from '../../../../../src';
import { HeroDamagedEnemyDto } from '../../dto/hero-damaged-enemy.dto';

export class HeroDamagedEnemyEvent extends EventStoreEvent<HeroDamagedEnemyDto> {
  @ValidateNested()
  @Type(() => HeroDamagedEnemyDto)
  public declare data: HeroDamagedEnemyDto;
}
