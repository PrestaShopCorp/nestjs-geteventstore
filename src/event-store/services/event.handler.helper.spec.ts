import EventHandlerHelper from './event.handler.helper';
import { Logger, Logger as logger } from '@nestjs/common';

describe('EventHandlerHelper', () => {
  jest.mock('@nestjs/common');
  beforeEach(() => {
    jest.spyOn(logger, 'log').mockImplementation(() => null);
    jest.spyOn(logger, 'error').mockImplementation(() => null);
    jest.spyOn(logger, 'debug').mockImplementation(() => null);
  });

  it('should be callable', () => {
    const result = EventHandlerHelper.onEvent(
      logger as unknown as Logger,
      {},
      {},
    );
    expect(result).toBeTruthy();
  });
});
