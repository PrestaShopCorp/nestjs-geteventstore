import { ReadEventOptionsType, IReadEvent, IBaseEvent } from '../events';
import { IEventBusPrepublishConfig } from './event-bus-prepublish-config.interface';

type EventMapperType = (
  data: any,
  options: ReadEventOptionsType,
) => IReadEvent | null;

export type ReadEventBusConfigType<T extends IReadEvent = IReadEvent> =
  IEventBusPrepublishConfig<T> & {
    eventMapper?: EventMapperType;
    allowedEvents?: { [key: string]: IBaseEvent };
  };
