import Room from '../domain/room';
import { HotelAgreggate } from '../hotel.agreggate';
import { RoomRegistry } from '../domain/ports/room-registry';
import { ClientNotifier } from '../domain/ports/client-notifier';
import HouseMaid from '../domain/ports/house-maid';

export const HOTEL_REPOSITORY = Symbol();

export default interface HotelRepository {
  getHotel(
    roomRegistryHandler: RoomRegistry,
    clientNotifierHandler: ClientNotifier,
    houseMaidHandler: HouseMaid,
  ): Promise<HotelAgreggate>;

  getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;
}
