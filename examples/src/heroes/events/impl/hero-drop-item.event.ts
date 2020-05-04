import { ExpectedVersion, IAggregateEvent } from '../../../../../src';
import { v4 } from 'uuid';

export class HeroDropItemEvent implements IAggregateEvent {
  constructor(
    public readonly data: {
      heroId: string,
      itemId: string
    }) {
  }

  get streamName() {
    return `hero-${this.data.heroId}`;
  }

  get metadata() {
    return {
      version: 1,
      created_at: new Date(),
    };
  }

  get id() {
    return v4();
  }

  get expectedVersion() {
    return ExpectedVersion.Any;
  }
}
