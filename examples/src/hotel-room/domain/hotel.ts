import { RoomRegistry } from './ports/room-registry';
import { ClientNotifier } from './ports/client-notifier';
import Room from './room';
import Client from './client';
import HouseMaid from './ports/house-maid';

export default class Hotel {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly clientNotifier: ClientNotifier,
    private readonly houseMaid: HouseMaid,
  ) {}

  public async reserveRoom(
    client: Client,
    arrival: Date,
    checkout: Date,
  ): Promise<Room> {
    const availableRoom: Room = await this.roomRegistry.reserveAvailableRoom(
      client.getId(),
      arrival,
      checkout,
    );
    if (availableRoom === null) {
      return null;
    }
    await this.clientNotifier.notifyClientByEmail(client.getId());
    return availableRoom;
  }

  public givesKeyToClient(client: Client, room: Room): void {
    client.takeTheRoomKey(room.getNumber());
  }

  public async checksTheRoomOut(
    room: Room,
  ): Promise<'allIsOk' | 'towelsMissing'> {
    return this.houseMaid.checksOutRoom(room);
  }

  public async makesTheClientPay(
    client: Client,
    moneyAmount: number,
  ): Promise<void> {
    client.payTheBill(moneyAmount);
  }

  public async cleansTheRoom(room: Room): Promise<void> {
    await this.houseMaid.cleansTheRoom(room);
    await this.roomRegistry.releaseRoom(room);
  }
}
