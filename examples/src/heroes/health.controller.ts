import {
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import { EventStoreHealthIndicator } from '../../../src';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private indicator: EventStoreHealthIndicator
    //private eventStoreBus: EventStoreBus,
  ) {
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.indicator.check(),
    ]);
  }
}

