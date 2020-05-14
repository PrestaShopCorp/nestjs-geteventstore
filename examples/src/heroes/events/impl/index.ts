import { HeroFoundItemEvent } from './hero-found-item.event';
import { HeroKilledDragonEvent } from './hero-killed-dragon.event';
import { HeroDropItemEvent } from './hero-drop-item.event';
import { HeroDamagedEnemyEvent } from './hero-damaged-enemy.event';

export const heroesEvents = {
  HeroDamagedEnemyEvent,
  HeroKilledDragonEvent,
  HeroFoundItemEvent,
  HeroDropItemEvent,
};
