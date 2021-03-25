import { ReadEventOptionsType, IReadEvent } from '../events';

type EventMapperType = (
  data: any,
  options: ReadEventOptionsType,
) => IReadEvent | null;

type EventConstructorType<T extends IReadEvent = IReadEvent> = new (
  ...args: any[]
) => T;

export type ReadEventBusConfigType =
  | {
      eventMapper: EventMapperType;
      allowedEvents?: never;
    }
  | {
      eventMapper?: never;
      allowedEvents: EventConstructorType[];
    };
