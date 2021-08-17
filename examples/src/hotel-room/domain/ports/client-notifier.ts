export const CLIENT_NOTIFIER = Symbol();

export interface ClientNotifier {
  sendConfirmation(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<void>;
}
