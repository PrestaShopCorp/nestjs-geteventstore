import { Injectable } from '@nestjs/common';
import { ICommand, Saga } from '@nestjs/cqrs';
import * as clc from 'cli-color';
import { v4 } from 'uuid';
import { Context, CONTEXT_CORRELATION_ID } from 'nestjs-context';
import { Observable } from 'rxjs';
import { delay, filter, map } from 'rxjs/operators';
import { DropAncientItemCommand } from '../commands/impl/drop-ancient-item.command';
import { HeroKilledDragonEvent } from '../events/impl/hero-killed-dragon.event';

const itemId = '0';

@Injectable()
export class HeroesGameSagas {
  constructor(private readonly context: Context) {}
  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      //@ts-ignore
      filter((ev) => ev instanceof HeroKilledDragonEvent),
      //@ts-ignore
      delay(400),
      //@ts-ignore
      map((event: HeroKilledDragonEvent) => {
        this.context.setCachedValue(
          CONTEXT_CORRELATION_ID,
          event?.metadata?.correlation_id || v4(),
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
