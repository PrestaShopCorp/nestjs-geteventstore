import Room from '../room';

export default interface HouseMaid {
  // Query
  checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'>;

  // Command
  cleansTheRoom(room: Room): void;
}
