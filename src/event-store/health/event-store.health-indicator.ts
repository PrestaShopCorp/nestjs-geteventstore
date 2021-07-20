import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Inject, Injectable } from '@nestjs/common';
import { EVENT_STORE_CONNECTOR } from '../services/event-store.constants';
import { Client } from '@eventstore/db-client/dist/Client';

@Injectable()
export class EventStoreHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStore: Client,
  ) {
    super();
  }

  public check(): HealthIndicatorResult {
    // if (!this.eventStore.isConnected()) {
    //   throw new HealthCheckError(`EventStore connection lost`, {
    //     eventStore: `Connection lost to ${this.eventStore.getConfig().tcp.host}:${this.eventStore.getConfig().tcp.port}`,
    //   });
    // }
    // return super.getStatus('eventStore', true, {
    //   message: `Connected to ${this.eventStore.getConfig().tcp.host}:${this.eventStore.getConfig().tcp.port}`,
    // });

    // TODO : improve this
    return super.getStatus('eventStore', true, {
      // message: this.eventStore.isConnected(),
    });
  }
}
