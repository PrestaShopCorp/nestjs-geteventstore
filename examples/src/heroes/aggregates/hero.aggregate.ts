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

  async damageEnemy(dragonId: string, hitPoint: number) {
    return this.apply(
      new HeroDamagedEnemyEvent({
        heroId: this.id,
        // comment dragonId if you want to test validation,
        dragonId,
        hitPoint: hitPoint,
      } as any),
    );
  }

  async killEnemy(dragonId: string) {
    // logic
    return this.apply(
      new HeroKilledDragonEvent({
        heroId: this.id,
        dragonId,
      }),
    );
  }

  async addItem(itemId: string) {
    // logic
    return this.apply(
      new HeroFoundItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }

  async dropItem(itemId: string) {
    return this.apply(
      new HeroDropItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }
}
