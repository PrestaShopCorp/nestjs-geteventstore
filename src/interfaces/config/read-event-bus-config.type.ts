import { ReadEventOptionsType, IReadEvent } from '../events';
import { IEventBusPrepublishConfig } from './event-bus-prepublish-config.interface';

type EventMapperType = (
  data: any,
  options: ReadEventOptionsType,
) => IReadEvent | null;

type EventConstructorType<T extends IReadEvent = IReadEvent> = new (
  ...args: any[]
) => T;

export type ReadEventBusConfigType = IEventBusPrepublishConfig<IReadEvent> &
  (
    | {
        eventMapper: EventMapperType;
        allowedEvents?: never;
      }
    | {
        eventMapper?: never;
        allowedEvents: { [key: string]: EventConstructorType };
      }
  );
