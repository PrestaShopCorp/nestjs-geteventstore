import Room from '../room';

export const ROOM_REGISTRY = Symbol();

export interface RoomRegistry {
  // Command
  releaseRoom(room: Room): Promise<void>;

  // Query
  reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;
}
