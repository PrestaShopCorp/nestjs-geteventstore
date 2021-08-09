import { Controller, Get, Logger, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { IVolatileSubscriptionConfig } from '@nestjs-geteventstore/interfaces';
import { StreamSubscription } from '@eventstore/db-client/dist/types';
import { from, Subject } from 'rxjs';

@Controller('volatile-subscription')
export default class VolatileSubscriptionController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('subscribe/:stream')
  public async subscribeVolatileSubscription(
    @Param('stream') stream = '$test-stream',
  ): Promise<any> {
    const volatileSubscription: IVolatileSubscriptionConfig = {
      stream,
      onSubscriptionStart: () => console.log('onSubscriptionStart'),
      onSubscriptionDropped: () => console.log('onSubscriptionDropped'),
    };
    const subs = (await this.eventStoreService.subscribeToVolatileSubscriptions(
      [volatileSubscription],
    )) as StreamSubscription[];

    const eventSpotted$ = new Subject<any>();
    subs.map((sub) => {
      return sub.on('data', (event) => {
        eventSpotted$.next(event.event['data']);
        eventSpotted$.complete();
      });
    });

    return from(eventSpotted$);
  }
}
