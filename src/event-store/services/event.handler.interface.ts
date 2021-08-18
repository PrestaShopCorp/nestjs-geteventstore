export const EVENT_STORE_EVENT_HANDLERS = Symbol();

export interface IEventHandler {
  onEvent(subscription, payload): Promise<any>;
}
