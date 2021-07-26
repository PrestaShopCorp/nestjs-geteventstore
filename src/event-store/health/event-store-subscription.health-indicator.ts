import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import EventStoreConnector, {
  EVENT_STORE_CONNECTOR,
} from '../connector/interface/event-store-connector';

@Injectable()
export class EventStoreSubscriptionHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStore: EventStoreConnector,
  ) {
    super();
  }

  public check(): HealthIndicatorResult {
    const res = {},
      causes = {};
    const subscriptions = this.eventStore.getSubscriptions().persistent;

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
