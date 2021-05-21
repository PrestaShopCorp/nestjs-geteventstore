import { HeroFoundItemEvent } from '../events/impl/hero-found-item.event';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';
import { HeroDropItemEvent } from '../events/impl/hero-drop-item.event';
import { HeroDamagedEnemyEvent } from '../events/impl/hero-damaged-enemy.event';
import { EventStoreAggregateRoot } from '../../../../src';

export class Hero extends EventStoreAggregateRoot {
  constructor(private readonly id) {
    super();
    // comment this line to test correlation-id auto-generated stream
    this.streamName = `hero-${id}`;
  }

  damageEnemy(dragonId: string, hitPoint: number) {
    this.apply(
      new HeroDamagedEnemyEvent({
        heroId: this.id,
        dragonId,
        hitPoint: hitPoint,
      }),
    );
  }

  killEnemy(dragonId: string) {
    // logic
    this.apply(
      new HeroKilledDragonEvent({
        heroId: this.id,
        dragonId,
      }),
    );
  }

  addItem(itemId: string) {
    // logic
    this.apply(
      new HeroFoundItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }

  dropItem(itemId: string) {
    this.apply(
      new HeroDropItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }
}
