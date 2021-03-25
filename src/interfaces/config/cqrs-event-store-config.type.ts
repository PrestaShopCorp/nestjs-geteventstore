import { ReadEventBusConfigType } from './read-event-bus-config.type';
import { IWriteEventBusConfig } from './write-event-bus-config.interface';
import { IEventStoreServiceConfig } from './event-store-service-config.interface';

export type CqrsEventStoreConfigType = ReadEventBusConfigType &
  IWriteEventBusConfig &
  IEventStoreServiceConfig;
