export default class Client {
  private roomKeyNumber: number;

  constructor(private readonly id: string) {}

  public getId(): string {
    return this.id;
  }

  public shouldOwnsTheRoomKey(): boolean {
    return true;
  }

  public takeTheRoomKey(roomNumber: number): void {
    this.roomKeyNumber = roomNumber;
  }

  public payTheBill(moneyAmount: number): void {}
}
