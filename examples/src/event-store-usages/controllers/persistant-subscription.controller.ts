import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { PersistentSubscriptionOptions } from '@nestjs-geteventstore/event-store/connector/interface/persistent-subscriptions-options';

@Controller('persistent-subscription')
export default class PersistantSubscriptionController {
  constructor(private readonly eventStoreService: EventStoreService) {}

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
  ): Promise<void> {
    return this.eventStoreService.subscribeToPersistentSubscriptions([
      {
        stream,
        group,
      },
    ]);
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
