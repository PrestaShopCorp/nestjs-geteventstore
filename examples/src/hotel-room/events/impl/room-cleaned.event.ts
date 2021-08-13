export class RoomCleanedEvent {
  constructor(
    public readonly roomNumber: number,
    public readonly result: 'allIsOk' | 'towelsMissing',
  ) {}
}
