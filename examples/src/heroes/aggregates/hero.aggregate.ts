import { HeroFoundItemEvent } from '../events/impl/hero-found-item.event';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';
import { HeroDropItemEvent } from '../events/impl/hero-drop-item.event';
import { HeroDamagedEnemyEvent } from '../events/impl/hero-damaged-enemy.event';
import { EventStoreAggregateRoot } from '../../../../src';

export class Hero extends EventStoreAggregateRoot {
  constructor(private readonly id) {
    super();
    this.streamName = `hero-${id}`;
  }

  damageEnemy(dragonId: string, hitPoint: number) {
    this.apply(
      new HeroDamagedEnemyEvent(
        {
          heroId: this.id,
          dragonId,
          hitPoint: hitPoint,
        },
        {
          metadata: {
            correlation_id: '1111',
            type: 'type',
            source: 'source',
          },
        },
      ),
    );
  }

  killEnemy(dragonId: string) {
    // logic
    this.apply(
      new HeroKilledDragonEvent(
        {
          heroId: this.id,
          dragonId,
        },
        {
          metadata: {
            correlation_id: '1111',
            type: 'type',
            source: 'source',
          },
        },
      ),
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
        itemId: 'string',
      }),
    );
  }
}
