import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PersistentSubscriptionOptions } from '@nestjs-geteventstore/event-store/connector/interface/persistent-subscriptions-options';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/interfaces/event-store.service.interface';
import { PersistentSubscription } from '@eventstore/db-client';

@Controller('persistent-subscription')
export default class PersistantSubscriptionController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

  @Post('create/:streamname/:group')
  public async createPersistentSubscription(
    @Param('streamname') streamName: string,
    @Param('group') group: string,
  ): Promise<void> {
    return this.eventStoreService.createPersistentSubscription(
      streamName,
      group,
      { fromRevision: 'start' },
    );
  }

  @Put('update/:streamname/:group')
  public async updatePersistentSubscription(
    @Param('streamname') streamName: string,
    @Param('group') group: string,
    @Body() persistentSubscriptionOptions: PersistentSubscriptionOptions,
  ): Promise<void> {
    return this.eventStoreService.updatePersistentSubscription(
      streamName,
      group,
      persistentSubscriptionOptions,
    );
  }

  @Get('read/:streamname/:group')
  public async readPersistentSubscription(
    @Param('streamname') stream: string,
    @Param('group') group: string,
    @Body() persistentSubscriptionOptions: PersistentSubscriptionOptions,
  ): Promise<any> {
    const persSub: PersistentSubscription =
      await this.eventStoreService.subscribeToPersistentSubscriptions([
        {
          stream,
          group,
        },
      ]);

    persSub.on('data', () => console.log('XXXXXXX'));

    return persSub;
  }

  @Delete('delete/:streamname/:group')
  public async deletePersistentSubscription(
    @Param('streamname') stream: string,
    @Param('group') group: string,
  ): Promise<void> {
    return await this.eventStoreService
      .deletePersistentSubscription(stream, group)
      .catch(() => {});
  }
}
