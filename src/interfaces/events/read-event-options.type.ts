import { IReadEvent } from './read-event.interface';

export type ReadEventOptionsType = Omit<
  IReadEvent,
  'data' | 'getStream' | 'getStreamCategory' | 'getStreamId'
>;
