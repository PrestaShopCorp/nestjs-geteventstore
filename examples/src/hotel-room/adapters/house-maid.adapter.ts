import { Injectable, Logger } from '@nestjs/common';
import HouseMaid from '../domain/ports/house-maid';

@Injectable()
export default class HouseMaidAdapter implements HouseMaid {
  private readonly logger = new Logger(this.constructor.name);

  public async checksOutRoom(
    roomId: number,
  ): Promise<'allIsOk' | 'towelsMissing'> {
    this.logger.debug('Async HouseMaidAdapter checksOutRoom...');
    return 'allIsOk';
  }

  public cleansTheRoom(roomId: number): void {
    this.logger.debug('Async HouseMaidAdapter cleansTheRoom...');
  }
}
