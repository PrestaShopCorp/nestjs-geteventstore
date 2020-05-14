import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { EventStoreBus } from '..';

export class EventStoreObserverHealthIndicator extends HealthIndicator {
  constructor(private eventStoreBus: EventStoreBus) {
    super();
  }

  public check(): HealthIndicatorResult {
    let res = [],
      causes = {};
    // FIXME missing name
    return super.getStatus('subscription', true, {
      message: `Connected to subsbscriptions ${res.join(', ')}`,
    });
  }
}
