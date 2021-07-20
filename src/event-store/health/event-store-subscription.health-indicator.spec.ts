import { EventStoreSubscriptionHealthIndicator } from './event-store-subscription.health-indicator';

describe('EventStoreSubscriptionHealthIndicator', () => {
  let service: EventStoreSubscriptionHealthIndicator;

  beforeEach(() => {
    service = new EventStoreSubscriptionHealthIndicator();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
