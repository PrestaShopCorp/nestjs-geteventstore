export default class CommandResponse {
  constructor(
    public readonly result: 'success' | 'fail',
    public readonly errorMsg?: string,
  ) {}
}
