import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { EventStoreBus } from '..';

export class EventStoreBusHealthIndicator extends HealthIndicator {
  constructor(private eventStoreBus: EventStoreBus) {
    super();
  }

  public check(): HealthIndicatorResult {
    let res = {}, causes = {};
    const subscriptions = this.eventStoreBus.subscriptions.persistent;
    for(const subscriptionName in subscriptions) {
      if(subscriptions[subscriptionName].isConnected === false) {
        causes[subscriptionName] = `Subscription ${subscriptions[subscriptionName].streamName} ${subscriptions[subscriptionName].group} dropped`
        throw new HealthCheckError(
          `subscription-${subscriptionName}`,
          causes,
        );
      }
      res[`subscription-${subscriptionName}`] = {
        status: 'up',
        message: `Connected to ${subscriptions[subscriptionName].streamName} ${subscriptions[subscriptionName].group}`
      }
    }
    return res;
  }
}