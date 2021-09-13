export default interface EventStoreHealthStatus {
  connection?: 'up' | 'down';
  subscriptions?: 'up' | 'down';
}
