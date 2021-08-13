import { Injectable } from '@nestjs/common';
import { HotelAgreggate } from '../hotel.agreggate';
import { ClientNotifier } from '../domain/ports/client-notifier';
import HouseMaid from '../domain/ports/house-maid';
import { RoomRegistry } from '../domain/ports/room-registry';
import Room from '../domain/room';
import HotelRepository from './hotel.repository.interface';

@Injectable()
export default class HotelRepositoryStub implements HotelRepository {
  constructor() {}

  public async getHotel(
    roomRegistryHandler: RoomRegistry,
    clientNotifierHandler: ClientNotifier,
    houseMaidHandler: HouseMaid,
  ): Promise<HotelAgreggate> {
    return new HotelAgreggate(
      '1234',
      roomRegistryHandler,
      clientNotifierHandler,
      houseMaidHandler,
    );
  }

  public async getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null> {
    return new Room(101);
  }
}
