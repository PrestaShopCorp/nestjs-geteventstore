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

const serverConfig: IEventStoreServiceConfig = {
  subscriptions: {
    persistent: [
      {
        // Event stream category (before the -)
        stream: '$ce-hero',
        group: 'data',
        autoAck: false,
        bufferSize: 500,
        // Subscription is created with this options
        options: {
          resolveLinkTos: true,
          minCheckPointCount: 1,
        },
      },
    ],
  },
};

@Module({
  controllers: [PersistantSubscriptionController],
  imports: [
    EventStoreModule.register(
      eventStoreConfig as IEventStoreConfig,
      serverConfig,
    ),
  ],
})
export default class PersistentSubscriptionModule {}
