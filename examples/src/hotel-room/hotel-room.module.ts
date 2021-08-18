import { Module, OnApplicationBootstrap, Provider, Type } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';
import {
  CqrsModule,
  ICommandHandler,
  IEventHandler,
  IQueryHandler,
} from '@nestjs/cqrs';
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
import { ProjectionOnetime } from './extention/es-subsystems/projection.onetime';
import { resolve } from 'path';
import EsSubsystemConfiguration from './extention/es-subsystems/es-subsystem.configuration';
import { HOTEL_REPOSITORY } from './repositories/hotel.repository.interface';
import HotelEventStore from './repositories/hotel.event-store.repository';
import ESEventBus from './extention/es-event-bus';
import ESEvent from './extention/es-event';
import { EventStoreDBClient } from '@eventstore/db-client';
import { Client } from '@eventstore/db-client/dist/Client';
import { EVENT_STORE_CONNECTOR } from './hotel-room.constant';

export const EVENT_STORE_SUBSYSTEMS = Symbol();
export const EVENT_STORE_EVENTS_HANDLERS = Symbol();

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
    ProjectionOnetime.fromFile(
      resolve(`${__dirname}/projections/hotel-state.js`),
    ),
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
const eventStoreConnector: Client = EventStoreDBClient.connectionString(
  process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
);

@Module({
  imports: [
    // EventStoreCqrsModule.connect(
    //   process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
    //   esConfig,
    //   EventsHandlers,
    // ),
    CqrsModule,
  ],
  controllers: [HotelRoomController],
  providers: [
    {
      provide: HOTEL_REPOSITORY,
      useClass: HotelEventStore,
    },
    ...QueryHandlers,
    ...CommandHandlers,
    ...AdaptersHandlers,
    ...EventsHandlers,

    {
      provide: EVENT_STORE_CONNECTOR,
      useFactory: () => {
        const connectionString =
          process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false';
        return EventStoreDBClient.connectionString(connectionString);
      },
    },
    ESEventBus,
  ],
})
export default class HotelRoomModule<EventBase extends ESEvent = ESEvent>
  implements OnApplicationBootstrap
{
  constructor(private readonly eventsBus: ESEventBus<EventBase>) {}

  public onApplicationBootstrap(): void {
    this.eventsBus.init(EventsHandlers, esConfig);
  }
}
