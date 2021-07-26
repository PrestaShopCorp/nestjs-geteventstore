import { Module } from '@nestjs/common';
import PersistantSubscriptionController from './persistant-subscription.controller';
import { IEventStoreConfig } from '@nestjs-geteventstore/event-store/config';
import { GrpcEventStoreConfig } from '@nestjs-geteventstore/event-store/config/grpc/grpc-event-store-config';
import { EventStoreModule } from '@nestjs-geteventstore/event-store/event-store.module';

const eventStoreConfig: GrpcEventStoreConfig = {
  connectionSettings: {
    connectionString:
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
  },
  defaultUserCredentials: {
    username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
    password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
  },
};

@Module({
  controllers: [PersistantSubscriptionController],
  imports: [
    EventStoreModule.register(eventStoreConfig as IEventStoreConfig, {}),
  ],
})
export default class PersistentSubscriptionModule {}
