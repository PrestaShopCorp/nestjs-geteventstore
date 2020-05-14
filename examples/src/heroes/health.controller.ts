import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import {
  EventStoreSubscriptionHealthIndicator,
  EventStoreHealthIndicator,
} from '../../../src';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private eventStoreHealthIndicator: EventStoreHealthIndicator,
    private eventStoreSubscriptionHealthIndicator: EventStoreSubscriptionHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.eventStoreHealthIndicator.check(),
      async () => this.eventStoreSubscriptionHealthIndicator.check(),
    ]);
  }
}
