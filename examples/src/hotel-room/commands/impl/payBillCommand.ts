export class PayBillCommand {
  constructor(
    public readonly clientId: string,
    public readonly checkoutResult: 'allIsOk' | 'towelsMissing',
  ) {}
}
