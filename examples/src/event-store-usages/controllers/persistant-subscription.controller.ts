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
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/event-store.service.interface';
import { PersistentSubscription } from '@eventstore/db-client';
import { PersistentSubscriptionSettings } from '@eventstore/db-client/dist/utils';
import { DeletePersistentSubscriptionOptions } from '@eventstore/db-client/dist/persistentSubscription';

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
    @Body()
    persistentSubscriptionSettings: Partial<PersistentSubscriptionSettings>,
  ): Promise<void> {
    return this.eventStoreService.updatePersistentSubscription(
      streamName,
      group,
      persistentSubscriptionSettings,
    );
  }

  @Get('read/:streamname/:group')
  public async readPersistentSubscription(
    @Param('streamname') stream: string,
    @Param('group') group: string,
  ): Promise<PersistentSubscription[]> {
    const persSub: PersistentSubscription[] =
      await this.eventStoreService.subscribeToPersistentSubscriptions([
        {
          stream,
          group,
        },
      ]);

    persSub[0].on('data', () => console.log('XXXXXXX'));

    return persSub;
  }

  @Delete('delete/:streamname/:group')
  public async deletePersistentSubscription(
    @Param('streamname') stream: string,
    @Param('group') group: string,
    @Body()
    deletePersistentSubscriptionOptions: Partial<DeletePersistentSubscriptionOptions>,
  ): Promise<void> {
    return await this.eventStoreService
      .deletePersistentSubscription(
        stream,
        group,
        deletePersistentSubscriptionOptions,
      )
      .catch(() => {});
  }
}
