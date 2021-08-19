import { ProjectionConfiguration } from './projection.configuration';
import { SubscriptionConfiguration } from './subscription.configuration';

export default interface EsSubsystemConfiguration {
  projections?: ProjectionConfiguration[];
  subscriptions?: SubscriptionConfiguration[];
}
