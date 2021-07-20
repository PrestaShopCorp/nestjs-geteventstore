import EventHandlerHelper from './event.handler.helper';
import { Logger } from '@nestjs/common';

describe('EventHandlerHelper', () => {
  const loggerMock: Logger = new Logger(EventHandlerHelper.name);

  beforeEach(() => {
    jest.spyOn(loggerMock, 'log').mockImplementation(() => null);
    jest.spyOn(loggerMock, 'error').mockImplementation(() => null);
    jest.spyOn(loggerMock, 'debug').mockImplementation(() => null);
  });

  it('should be callable', () => {
    const result = EventHandlerHelper.onEvent(loggerMock, {}, {});
    expect(result).toBeTruthy();
  });
});
