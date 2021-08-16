export default class Client {
  constructor(private readonly id: string) {}

  public getId(): string {
    return this.id;
  }

  public payTheBill(moneyAmount: number): void {}
}
