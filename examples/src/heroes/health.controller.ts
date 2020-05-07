import {
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import { EventStoreHealthIndicator } from '../../../src';
import { EventStoreBusHealthIndicator } from '../../../src/health/event-store-bus.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private eventStoreHealthIndicator: EventStoreHealthIndicator,
    private eventStoreBusHealthIndicator: EventStoreBusHealthIndicator,
    //private eventStoreBus: EventStoreBus,
  ) {
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.eventStoreHealthIndicator.check(),
      async () => this.eventStoreBusHealthIndicator.check(),
    ]);
  }
}

