import { IWriteEvent } from './write-event.interface';
import { ReadEventOptionsType } from './read-event-options.type';

type WriteEventOptionsType = Omit<IWriteEvent, 'data'> & {
  eventStreamId: never;
  eventNumber: never;
  originalEventId: never;
};

export type EventOptionsType = ReadEventOptionsType | WriteEventOptionsType;
