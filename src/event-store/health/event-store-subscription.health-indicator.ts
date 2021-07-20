import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class EventStoreSubscriptionHealthIndicator extends HealthIndicator {
  public check(): HealthIndicatorResult {
    return { examplePersistentSubscription: { status: 'up' } };
  }
}
