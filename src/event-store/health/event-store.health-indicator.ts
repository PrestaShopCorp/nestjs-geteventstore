import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import EventStoreHealthStatus from './event-store-health.status';

@Injectable()
export class EventStoreHealthIndicator extends HealthIndicator {
  private esStatus: EventStoreHealthStatus;

  constructor() {
    super();
  }

  public check(): HealthIndicatorResult {
    return {
      connection: { status: this.esStatus.connection },
      subscriptions: { status: this.esStatus.subscriptions },
    };
  }

  public updateStatus(esHealthStatus: EventStoreHealthStatus): void {
    this.esStatus = { ...this.esStatus, ...esHealthStatus };
  }
}
