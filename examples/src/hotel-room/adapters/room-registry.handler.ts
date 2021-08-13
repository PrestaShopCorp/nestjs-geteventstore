import { RoomRegistry } from '../domain/ports/room-registry';
import Room from '../domain/room';
import { Inject, Injectable, Logger } from '@nestjs/common';
import HotelRepository from '../repositories/hotel.repository.stub';
import { HOTEL_REPOSITORY } from '../repositories/hotel.repository.interface';

@Injectable()
export default class RoomRegistryHandler implements RoomRegistry {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly hotelRepository: HotelRepository,
  ) {}

  public async releaseRoom(room: Room): Promise<void> {
    this.logger.log('Async RoomRegistry releaseRoom...');
  }

  public async reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null> {
    return this.hotelRepository.getAvailableRoom(clientId, arrival, checkout);
  }

  public async findRoomNumber(clientId: string): Promise<number> {
    return await this.hotelRepository.findRoomNumber(clientId);
  }
}
