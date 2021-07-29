import { Body, Controller, Get, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { PersistentSubscriptionOptions } from '@nestjs-geteventstore/event-store/connector/interface/persistent-subscriptions-options';

@Controller('persistent-subscription')
export default class PersistantSubscriptionController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('create/:streamname/:group')
  public async createPersistentSubscription(
    @Param('streamname') streamName: string,
    @Param('group') group: string,
  ): Promise<void> {
    return this.eventStoreService.createPersistentSubscription(
      streamName,
      group,
    );
  }

  @Get('update/:streamname/:group')
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
}
