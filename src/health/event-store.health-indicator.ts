import { EventStore } from '../event-store.class';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

export class EventStoreHealthIndicator extends HealthIndicator {
  constructor(private eventStore: EventStore) {
    super();
  }

  public check(): HealthIndicatorResult {
    if (!this.eventStore.isConnected) {
      throw new HealthCheckError(
        `EventStore connection lost`,
        { eventStore: `Connection lost to ${this.eventStore.config.tcp.host}:${this.eventStore.config.tcp.port}` },
      );
    }
    return super.getStatus('eventStore', true, { message: `Connected to ${this.eventStore.config.tcp.host}:${this.eventStore.config.tcp.port}` });
  }
}