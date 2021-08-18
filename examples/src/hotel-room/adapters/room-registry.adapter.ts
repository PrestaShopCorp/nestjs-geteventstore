import { RoomRegistry } from '../domain/ports/room-registry';
import Room from '../domain/room';
import { Inject, Injectable, Logger } from '@nestjs/common';
import HotelRepository, {
  HOTEL_REPOSITORY,
} from '../repositories/hotel.repository.interface';

@Injectable()
export default class RoomRegistryAdapter implements RoomRegistry {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly hotelRepository: HotelRepository,
  ) {}

  public async releaseRoom(roomId: number): Promise<void> {
    this.logger.debug('Async RoomRegistryAdapter releaseRoom...');
  }

  public async reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null> {
    return new Room(
      await this.hotelRepository.getAvailableRoom(clientId, arrival, checkout),
    );
  }

  public async findRoomNumber(clientId: string): Promise<number> {
    return await this.hotelRepository.findRoomNumber(clientId);
  }

  public registerBillPaiement(clientId: string, billAmount: number): void {}

  public registerClientHasKey(clientId: string): Promise<void> {
    return;
  }
}
