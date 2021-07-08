import { Injectable } from '@nestjs/common';
import { ICommand, Saga } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { Observable } from 'rxjs';
import { delay, filter, map } from 'rxjs/operators';
import { DropAncientItemCommand } from '../commands/impl/drop-ancient-item.command';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';
import { Context, CONTEXT_CORRELATION_ID } from 'nestjs-context';

const itemId = '0';

@Injectable()
export class HeroesGameSagas {
  constructor(private readonly context: Context) {}

  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      filter((ev) => ev instanceof HeroKilledDragonEvent),
      delay(400),
      map((event: HeroKilledDragonEvent) => {
        // hack until nestjs-context introduces Saga context
        this.context.setCachedValue(
          CONTEXT_CORRELATION_ID,
          event.metadata.correlation_id,
        );
        console.log(
          clc.redBright('Inside [HeroesGameSagas] Saga after a little sleep'),
        );
        console.log(event);
        return new DropAncientItemCommand(event.data.heroId, itemId);
      }),
    );
  };
}
