export const EVENT_STORE_EVENT_HANDLER = Symbol();

export interface IEventHandler {
  onEvent(subscription, payload): Promise<any>;
}
