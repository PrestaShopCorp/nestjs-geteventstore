import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class HeroDamagedEnemyDto {
  @IsNotEmpty()
  @IsNumber()
  heroId: number;

  @IsNotEmpty()
  @IsString()
  dragonId: string;

  @IsNumber()
  hitPoint: number;
}
