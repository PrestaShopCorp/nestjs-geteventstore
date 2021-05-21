import {
  EventBusConfigType,
  IEventStoreConfig,
  IEventStoreModuleAsyncConfig,
  IEventStoreServiceConfig,
} from '../interfaces';

type OptionsConfig = IEventStoreServiceConfig & EventBusConfigType;

export class EventStoreCqrsModule {
  static register(config: IEventStoreConfig, options: OptionsConfig) {}
  static registerAsync(
    config: IEventStoreModuleAsyncConfig,
    options: OptionsConfig,
  ) {}
}
