import { ModuleMetadata } from '@nestjs/common/interfaces';
import { IEventStoreConfig } from './event-store-config.interface';

export interface IEventStoreAsyncConfig
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<IEventStoreConfig> | IEventStoreConfig;
  inject?: any[];
}
