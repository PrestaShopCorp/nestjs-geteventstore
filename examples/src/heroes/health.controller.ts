import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthIndicatorResult } from '@nestjs/terminus';
import { EventStoreHealthIndicator } from '../../../src';

@Controller('health')
export class HealthController {
  constructor(
    private readonly eventStoreHealthIndicator: EventStoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  public async healthCheck(): Promise<HealthIndicatorResult> {
    return this.eventStoreHealthIndicator.check();
  }
}
