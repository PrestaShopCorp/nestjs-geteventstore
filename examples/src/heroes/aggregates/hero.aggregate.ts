import { EventStoreAggregateRoot } from '../../../../src';
import { HeroDamagedEnemyEvent } from '../events/impl/hero-damaged-enemy.event';
import { HeroDropItemEvent } from '../events/impl/hero-drop-item.event';
import { HeroFoundItemEvent } from '../events/impl/hero-found-item.event';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';

export class Hero extends EventStoreAggregateRoot {
  constructor(private readonly id: string) {
    super();
    // comment this line to test correlation-id auto-generated stream
    this.streamName = `hero-${id}`;
  }

  damageEnemy(dragonId: string, hitPoint: number): Promise<void> {
    return this.apply(
      new HeroDamagedEnemyEvent({
        heroId: this.id,
        // comment dragonId if you want to test validation,
        dragonId,
        hitPoint: hitPoint,
      } as any),
    );
  }

  killEnemy(dragonId: string): Promise<void> {
    // logic
    return this.apply(
      new HeroKilledDragonEvent({
        heroId: this.id,
        dragonId,
      }),
    );
  }

  addItem(itemId: string): Promise<void> {
    // logic
    return this.apply(
      new HeroFoundItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }

  dropItem(itemId: string): Promise<void> {
    return this.apply(
      new HeroDropItemEvent({
        heroId: this.id,
        itemId,
      }),
    );
  }
}
