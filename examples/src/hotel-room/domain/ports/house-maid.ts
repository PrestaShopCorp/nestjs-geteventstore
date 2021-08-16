import Room from '../room';

export const HOUSE_MAID = Symbol();

export default interface HouseMaid {
  checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'>;

  cleansTheRoom(room: Room): void;
}
