import {
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import { EventStoreHealthIndicator, EventStoreBusHealthIndicator } from '../../../src';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private eventStoreHealthIndicator: EventStoreHealthIndicator,
    private eventStoreBusHealthIndicator: EventStoreBusHealthIndicator,
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

