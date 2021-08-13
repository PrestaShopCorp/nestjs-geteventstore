import Room from '../room';

export const ROOM_REGISTRY = Symbol();

export interface RoomRegistry {
  findRoomNumber(clientId: string): Promise<number>;

  releaseRoom(room: Room): Promise<void>;

  reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;

  registerBillPaiement(clientId: string, billAmount: number): void;
}
