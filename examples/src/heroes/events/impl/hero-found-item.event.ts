import { EventStoreEvent } from '../../../../../src';

export class HeroFoundItemEvent extends EventStoreEvent {
  constructor(public readonly heroId: string, public readonly itemId: string) {}
}
