import { IMappedEventOptions, IReadEvent } from '../events';

type EventConstructorType<T extends IReadEvent = IReadEvent> = new (
  ...args: any[]
) => T;

// TODO jdm validate that one of the two options was given
export interface IReadEventBusConfig {
  eventMapper?: (data: any, options: IMappedEventOptions) => IReadEvent | null;
  allowedEvents?: EventConstructorType[];
}
