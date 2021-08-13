import Room from '../domain/room';
import { RoomRegistry } from '../domain/ports/room-registry';
import { ClientNotifier } from '../domain/ports/client-notifier';
import HouseMaid from '../domain/ports/house-maid';
import Hotel from '../domain/hotel';

export const HOTEL_REPOSITORY = Symbol();

export default interface HotelRepository {
  getHotel(
    roomRegistryHandler: RoomRegistry,
    clientNotifierHandler: ClientNotifier,
    houseMaidHandler: HouseMaid,
  ): Promise<Hotel>;

  getClientRoom(clientId: string): Promise<Room>;

  getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;
}
