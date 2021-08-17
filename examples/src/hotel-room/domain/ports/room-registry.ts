import Room from '../room';

export const ROOM_REGISTRY = Symbol();

export interface RoomRegistry {
  registerClientHasKey(clientId: string): Promise<void>;

  findRoomNumber(clientId: string): Promise<number | null>;

  releaseRoom(roomNumber: number): Promise<void>;

  reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;

  registerBillPaiement(clientId: string, billAmount: number): void;
}
