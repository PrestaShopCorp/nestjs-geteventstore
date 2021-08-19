import { Module, Provider, Type } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';
import { ICommandHandler, IEventHandler, IQueryHandler } from '@nestjs/cqrs';
import RoomRegistryAdapter from './adapters/room-registry.adapter';
import HouseMaidAdapter from './adapters/house-maid.adapter';
import ClientNotifierAdapter from './adapters/client-notifier.adapter';
import { ROOM_REGISTRY } from './domain/ports/room-registry';
import { HOUSE_MAID } from './domain/ports/house-maid';
import { CLIENT_NOTIFIER } from './domain/ports/client-notifier';
import { ClientNotifiedEventHandler } from './events/handlers/client-notified.event.handler';
import { ClientReservesRoomCommandHandler } from './commands/handlers/client-reserves-room.command.handler';
import { NotifyClientCommandHandler } from './commands/handlers/notify-client.command.handler';
import { ClientReservedRoomEventHandler } from './events/handlers/client-reserved-room.event.handler';
import { ClientArrivesCommandHandler } from './commands/handlers/client-arrives.command.handler';
import { ClientArrivedEventHandler } from './events/handlers/client-arrived.event.handler';
import { ClientPaidEventHandler } from './events/handlers/client-paid.event.handler';
import { PayBillCommandHandler } from './commands/handlers/pay-bill-command.handler';
import CheckoutRoomQueryHandler from './queries/handlers/checkout-room.query.handler';
import GetClientRoomQueryHandler from './queries/handlers/get-client-room.query.handler';
import GetClientReceiptQueryHandler from './queries/handlers/get-client-receipt.query.handler';
import GetHotelStateQueryHandler from './queries/handlers/get-hotel-state.query.handler';
import { BuildNewHotelCommandHandler } from './commands/handlers/build-new-hotel.command.handler';
import { HotelBuiltEventHandler } from './events/handlers/hotel-built.event.handler';
import { resolve } from 'path';
import { HOTEL_REPOSITORY } from './repositories/hotel.repository.interface';
import HotelEventStore from './repositories/hotel.event-store.repository';
import EsSubsystemConfiguration from '@nestjs-geteventstore/cqrs2/es-subsystems/es-subsystem.configuration';
import {
  ProjectionOnetimeConfiguration,
  SubscriptionConfiguration,
} from '@nestjs-geteventstore/cqrs2';
import EventStoreCqrsModule from '@nestjs-geteventstore/cqrs2/event-store-cqrs-module';
import { persistentSubscriptionSettingsFromDefaults } from '@eventstore/db-client';
import {
  HOTEL_STREAM_GROUP,
  HOTEL_STREAM_NAME,
} from './hotel-stream.constants';

// const eventStoreConfig: GrpcEventStoreConfig = {
// 	connectionSettings: {
// 		connectionString:
// 		  process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
// 	},
// 	defaultUserCredentials: {
// 		username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
// 		password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
// 	},
// };
//
// const serviceConfig: IEventStoreServiceConfig = {
// 	subscriptions: {
// 		persistent: [
// 			{
// 				// Event stream category (before the -)
// 				stream: 'hotel-stream',
// 				group: 'data',
// 				autoAck: false,
// 				bufferSize: 500,
// 				// Subscription is created with this options
// 				options: {
// 					resolveLinkTos: true,
// 					minCheckPointCount: 1,
// 				},
// 			},
// 		],
//
// 	},
// };
const esConfig: EsSubsystemConfiguration = {
  projections: [
    ProjectionOnetimeConfiguration.fromFile(
      resolve(`${__dirname}/projections/hotel-state.js`),
    ),
  ],
  subscriptions: [
    {
      stream: HOTEL_STREAM_NAME,
      group: HOTEL_STREAM_GROUP,
      options: persistentSubscriptionSettingsFromDefaults({
        resolveLinkTos: false,
      }),
    } as SubscriptionConfiguration,
  ],
};

export const CommandHandlers: Type<ICommandHandler>[] = [
  ClientReservesRoomCommandHandler,
  NotifyClientCommandHandler,
  ClientArrivesCommandHandler,
  PayBillCommandHandler,
  BuildNewHotelCommandHandler,
];

export const QueryHandlers: Type<IQueryHandler>[] = [
  CheckoutRoomQueryHandler,
  GetClientRoomQueryHandler,
  GetClientReceiptQueryHandler,
  GetHotelStateQueryHandler,
];

export const EventsHandlers: Type<IEventHandler>[] = [
  ClientReservedRoomEventHandler,
  ClientNotifiedEventHandler,
  ClientArrivedEventHandler,
  ClientPaidEventHandler,
  HotelBuiltEventHandler,
];

export const AdaptersHandlers: Provider[] = [
  {
    provide: ROOM_REGISTRY,
    useClass: RoomRegistryAdapter,
  },
  {
    provide: HOUSE_MAID,
    useClass: HouseMaidAdapter,
  },
  {
    provide: CLIENT_NOTIFIER,
    useClass: ClientNotifierAdapter,
  },
];
@Module({
  imports: [
    EventStoreCqrsModule.connect(
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
      esConfig,
    ),
  ],
  controllers: [HotelRoomController],
  providers: [
    {
      provide: HOTEL_REPOSITORY,
      useClass: HotelEventStore,
    },
    ...AdaptersHandlers,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventsHandlers,
  ],
})
export default class HotelRoomModule {}
