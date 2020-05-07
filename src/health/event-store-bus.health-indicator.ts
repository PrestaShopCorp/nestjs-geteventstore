import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { EventStoreBus } from '..';

export class EventStoreBusHealthIndicator extends HealthIndicator {
  constructor(private eventStoreBus: EventStoreBus) {
    super();
  }

  public check(): HealthIndicatorResult {
    let res = [], causes = {};
    // FIXME missing name
    this.eventStoreBus.subscriptions.persistent.forEach((status, name) => {
      if(!status.status) {
        causes[name] = `Subscription dropped`
        throw new HealthCheckError(
          `subscription not connected`,
          causes,
        );
      }
      res.push(name);
    });
    return super.getStatus('subscription', true, { message: `Connected to subsbscriptions ${res.join(', ')}` });
  }
}