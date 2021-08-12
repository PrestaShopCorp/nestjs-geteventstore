import Room from './room';

export default interface HouseMaid {
  checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'>;

  cleansTheRoom(room: Room): void;
}
