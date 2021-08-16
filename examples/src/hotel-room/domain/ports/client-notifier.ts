export const CLIENT_NOTIFIER = Symbol();

export interface ClientNotifier {
  notifyClientByEmail(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<void>;
}
