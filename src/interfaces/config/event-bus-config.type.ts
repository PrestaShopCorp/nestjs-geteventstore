import { ReadEventBusConfigType } from './read-event-bus-config.type';
import { IWriteEventBusConfig } from './write-event-bus-config.interface';

export type EventBusConfigType = {
  read?: ReadEventBusConfigType;
  write?: IWriteEventBusConfig;
};
