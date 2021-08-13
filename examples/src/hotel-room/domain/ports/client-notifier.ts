export interface ClientNotifier {
  // Command
  notifyClientByEmail(clientId: string): Promise<void>;
}
