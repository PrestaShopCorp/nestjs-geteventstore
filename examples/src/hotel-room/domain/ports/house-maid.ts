export const HOUSE_MAID = Symbol();

export default interface HouseMaid {
  checksOutRoom(roomNumber: number): Promise<'allIsOk' | 'towelsMissing'>;

  cleansTheRoom(roomNumber: number): void;
}
