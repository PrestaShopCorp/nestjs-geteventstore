import { Module } from '@nestjs/common';
import PersistantSubscriptionController from './persistant-subscription.controller';

@Module({
          controllers: [PersistantSubscriptionController],
        })
export default class PersistentSubscriptionModule {
}
