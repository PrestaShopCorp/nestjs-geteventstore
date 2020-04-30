import { AggregateRoot } from '@nestjs/cqrs';
import { HeroFoundItemEvent } from '../events/impl/hero-found-item.event';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';
import { HeroDropItemEvent } from '../events/impl/hero-drop-item.event';

export class Hero extends AggregateRoot {
  constructor(private readonly id: string) {
    super();
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
    this.apply(new HeroDropItemEvent({
      heroId: this.id,
      itemId
    }));
  }
}
