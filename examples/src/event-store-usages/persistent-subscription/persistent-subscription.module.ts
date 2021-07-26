import { Module } from '@nestjs/common';
import {
  IEventStoreConfig,
  IEventStoreServiceConfig,
} from '@nestjs-geteventstore/event-store/config';
import { GrpcEventStoreConfig } from '@nestjs-geteventstore/event-store/config/grpc/grpc-event-store-config';
import { EventStoreModule } from '@nestjs-geteventstore/event-store/event-store.module';
import PersistantSubscriptionController from './persistant-subscription.controller';

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

const serverConfig: IEventStoreServiceConfig = {};

@Module({
  controllers: [PersistantSubscriptionController],
  imports: [
    EventStoreModule.registerRgpc(
      eventStoreConfig as IEventStoreConfig,
      serverConfig,
    ),
  ],
})
export default class PersistentSubscriptionModule {}
