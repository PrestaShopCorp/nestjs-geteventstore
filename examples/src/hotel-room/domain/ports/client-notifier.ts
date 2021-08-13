export const CLIENT_NOTIFIER = Symbol();

export interface ClientNotifier {
  // Command
  notifyClientByEmail(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<void>;
}
