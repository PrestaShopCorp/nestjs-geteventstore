import {IReadEventBusConfig} from "./read-event-bus-config.interface";
import {IWriteEventBusConfig} from "./write-event-bus-config.interface";

export interface IEventBusConfig extends IReadEventBusConfig, IWriteEventBusConfig {}
