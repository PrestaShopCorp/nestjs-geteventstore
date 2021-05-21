import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class HeroDamagedEnemyDto {
  @IsNotEmpty()
  @IsString()
  heroId: string;

  @IsNotEmpty()
  @IsString()
  dragonId: string;

  @IsNumber()
  hitPoint: number;
}
