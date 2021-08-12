import Room from './room';

export interface RoomRegistry {
  releaseRoom(room: Room): Promise<void>;
  reserveAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null>;
}
