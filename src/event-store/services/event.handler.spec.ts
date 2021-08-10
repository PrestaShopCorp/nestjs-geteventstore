import EventHandler from './event.handler';
import { IEventHandler } from './event.handler.interface';

describe('EventHandler', () => {
  let eventHandler: IEventHandler;

  beforeEach(() => {
    eventHandler = new EventHandler();
  });

  it('should be created', () => {
    expect(eventHandler).toBeTruthy();
  });
});
