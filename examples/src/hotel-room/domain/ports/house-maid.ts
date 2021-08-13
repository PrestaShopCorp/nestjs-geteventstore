import Room from '../room';

export const HOUSE_MAID = Symbol();

export default interface HouseMaid {
  // Query
  checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'>;

  // Command
  cleansTheRoom(room: Room): void;
}
