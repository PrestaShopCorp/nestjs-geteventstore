import { HeroFoundItemEvent } from '../events/impl/hero-found-item.event';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';
import { HeroDropItemEvent } from '../events/impl/hero-drop-item.event';
import { AggregateRootWithStream } from '../../../../src/event-store/shared/aggregate-root.interface';

export class Hero extends AggregateRootWithStream {
  constructor(private id) {
    super();
  }
  get streamConfig() {
    return {
      streamName: `hero-${this.id}`
    }
  }
  killEnemy(dragonId: string) {
    // logic
    this.apply(new HeroKilledDragonEvent({
      heroId: this.id,
      dragonId
    }));
  }

  addItem(itemId: string) {
    // logic
    this.apply(new HeroFoundItemEvent({
      heroId: this.id,
      itemId
    }));

  }
  dropItem(itemId: string) {
    this.apply(new HeroDropItemEvent({
      heroId: this.id,
      itemId
    }));
  }
}
