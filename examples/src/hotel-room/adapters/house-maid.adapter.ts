import Room from '../domain/room';
import { Injectable, Logger } from '@nestjs/common';
import HouseMaid from '../domain/ports/house-maid';

@Injectable()
export default class HouseMaidAdapter implements HouseMaid {
  private readonly logger = new Logger(this.constructor.name);

  public async checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'> {
    this.logger.log('Async HouseMaidHandler checksOutRoom...');
    return 'allIsOk';
  }

  public cleansTheRoom(room: Room): void {
    this.logger.log('Async HouseMaidHandler cleansTheRoom...');
  }
}
