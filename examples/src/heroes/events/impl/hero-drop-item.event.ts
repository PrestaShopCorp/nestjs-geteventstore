import { EventStoreEvent } from '../../../../../src';

interface DataType {
  heroId: string;
  itemId: string;
}

export class HeroDropItemEvent extends EventStoreEvent<DataType> {
  constructor(public readonly data: DataType, options?) {
    super(data, options);
  }
}
