import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

export class EventStoreObserverHealthIndicator extends HealthIndicator {
  public check(): HealthIndicatorResult {
    let res = [];

    // FIXME missing name
    return super.getStatus('subscription', true, {
      message: `Connected to subsbscriptions ${res.join(', ')}`,
    });
  }
}
