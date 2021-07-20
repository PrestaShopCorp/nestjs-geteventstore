import { Module } from '@nestjs/common';
import { IEventStoreSubsystems } from '@nestjs-geteventstore/event-store/config';
import { EventStoreConnectionConfig } from '@nestjs-geteventstore/event-store/config/event-store-connection-config';
import { EventStoreModule } from '@nestjs-geteventstore/event-store/event-store.module';
import EventWriterController from './controllers/event-writer.controller';
import PersistantSubscriptionController from './controllers/persistant-subscription.controller';
import { resolve } from 'path';
import StreamReaderController from './controllers/stream-reader.controller';
import MetadatasController from './controllers/metadatas/metadatas.controller';
import ProjectionController from './controllers/projection.controller';
import VolatileSubscriptionController from './controllers/volatile-subscription.controller';

const eventStoreConfig: EventStoreConnectionConfig = {
  connectionSettings: {
    connectionString:
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
  },
  defaultUserCredentials: {
    username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
    password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
  },
};

const serverConfig: IEventStoreSubsystems = {
  projections: [
    {
      enabled: true,
      emitEnabled: true,
      mode: 'continuous',
      checkPointsEnabled: true,
      name: 'some-projection-continuous',
      file: resolve(`${__dirname}/projections/test-projection.js`),
    },
  ],
  subscriptions: {
    persistent: [
      {
        group: 'data',
        // Event stream category (before the -)
        stream: '$ce-usecase',
        // Subscription is created with this options
        settingsForCreation: {
          subscriptionSettings: {
            minCheckpointCount: 1,
            resolveLinkTos: true,
          },
        },
      },
    ],
  },
};

@Module({
  controllers: [
    MetadatasController,
    ProjectionController,
    EventWriterController,
    StreamReaderController,
    VolatileSubscriptionController,
    PersistantSubscriptionController,
  ],
  imports: [EventStoreModule.register(eventStoreConfig, serverConfig)],
})
export default class EventStoreUsagesModule {}
