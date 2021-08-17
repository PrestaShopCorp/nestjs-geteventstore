import { RoomRegistry } from './ports/room-registry';
import { ClientNotifier } from './ports/client-notifier';
import Room from './room';
import HouseMaid from './ports/house-maid';

export default class Hotel {
  constructor(
    private readonly roomRegistry: RoomRegistry,
    private readonly clientNotifier: ClientNotifier,
    private readonly houseMaid: HouseMaid,
  ) {}

  public async reserveRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room> {
    const availableRoom: Room = await this.roomRegistry.reserveAvailableRoom(
      clientId,
      arrival,
      checkout,
    );
    if (availableRoom === null || availableRoom === undefined) {
      return null;
    }
    await this.clientNotifier.sendConfirmation(clientId, arrival, checkout);
    return availableRoom;
  }

  public async givesKeyToClient(clientId: string): Promise<number | null> {
    const roomNumber: number = await this.findKey(clientId);
    await this.roomRegistry.registerClientHasKey(clientId);
    return roomNumber;
  }

  public async findKey(clientId: string): Promise<number> {
    return this.roomRegistry.findRoomNumber(clientId);
  }

  public async checksTheRoomOut(
    roomNumber: number,
  ): Promise<'allIsOk' | 'towelsMissing'> {
    return this.houseMaid.checksOutRoom(roomNumber);
  }

  public async makesTheClientPay(
    clientId: string,
    checkoutResult: 'allIsOk' | 'towelsMissing',
  ): Promise<number> {
    const roomNumber: number = await this.findKey(clientId);
    if (roomNumber === null) {
      return 0;
    }

    const moneyAmount: number = checkoutResult === 'allIsOk' ? 100 : 110;
    this.roomRegistry.registerBillPaiement(clientId, moneyAmount);
    return moneyAmount;
  }

  public async cleansTheRoom(roomNumber: number): Promise<void> {
    await this.houseMaid.cleansTheRoom(roomNumber);
    await this.roomRegistry.releaseRoom(roomNumber);
  }
}
