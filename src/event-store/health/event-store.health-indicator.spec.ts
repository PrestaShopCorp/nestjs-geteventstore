import { Logger as logger } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import EventStoreHealthStatus from './event-store-health.status';
import { EventStoreHealthIndicator } from './event-store.health-indicator';

describe('EventStoreHealthIndicator', () => {
  let service: EventStoreHealthIndicator;

  jest.mock('@nestjs/common');
  beforeEach(() => {
    service = new EventStoreHealthIndicator();
    jest.spyOn(logger, 'log').mockImplementation(() => null);
    jest.spyOn(logger, 'error').mockImplementation(() => null);
    jest.spyOn(logger, 'debug').mockImplementation(() => null);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  ['up', 'down'].forEach((status: 'up' | 'down') => {
    it(`should be notified when connection is ${status}`, () => {
      const esHealthStatus: EventStoreHealthStatus = {
        connection: status,
      };
      service.updateStatus(esHealthStatus);

      const check: HealthIndicatorResult = service.check();

      expect(check.connection.status).toEqual(status);
    });
  });

  ['up', 'down'].forEach((status: 'up' | 'down') => {
    it(`should be notified when subscription's connection is ${status}`, () => {
      const esHealthStatus: EventStoreHealthStatus = {
        subscriptions: status,
      };
      service.updateStatus(esHealthStatus);

      const check: HealthIndicatorResult = service.check();

      expect(check.subscriptions.status).toEqual(status);
    });
  });
});
