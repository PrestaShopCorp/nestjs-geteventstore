import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { EventStore } from '../event-store/event-store';

export class EventStoreSubscriptionHealthIndicator extends HealthIndicator {
  constructor(private eventStore: EventStore) {
    super();
  }

  public check(): HealthIndicatorResult {
    let res = {},
      causes = {};
    const subscriptions = this.eventStore.subscriptions.persistent;

    // TODO refactor
    for (const subscriptionName in subscriptions) {
      if (!subscriptions.hasOwnProperty(subscriptionName)) {
        continue;
      }
      if (subscriptions[subscriptionName].isConnected === false) {
        causes[
          subscriptionName
        ] = `Subscription ${subscriptions[subscriptionName].streamName} ${subscriptions[subscriptionName].group} dropped`;
        throw new HealthCheckError(`subscription-${subscriptionName}`, causes);
      }
      res[`subscription-${subscriptionName}`] = {
        status: 'up',
        message: `Connected to ${subscriptions[subscriptionName].streamName} ${subscriptions[subscriptionName].group}`,
      };
    }
    return res;
  }
}
