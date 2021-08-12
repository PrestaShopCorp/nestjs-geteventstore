export interface ClientNotifier {
  notifyClientByEmail(clientId: string): Promise<void>;
}
