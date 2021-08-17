export const HOTEL_REPOSITORY = Symbol();

export default interface HotelRepository {
  getClientRoom(clientId: string): Promise<number>;

  getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<number | null>;

  checksTheRoomOut(roomNumber: number): Promise<'allIsOk' | 'towelsMissing'>;

  getNbAvailableRooms(): Promise<number>;

  findRoomNumber(clientId: string): Promise<number>;

  registerBill(clientId: string, billAmount: number): void;

  freeRoom(clientId: string): void;

  getClientReceipt(clientId: string): number;
}
