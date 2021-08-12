export default class Room {
  constructor(private readonly roomNumber: number) {}

  public getNumber(): number {
    return this.roomNumber;
  }
}
