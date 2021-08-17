import { Module, OnApplicationBootstrap, Type } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';
import {
  CqrsModule,
  ICommandHandler,
  IEventHandler,
  IQueryHandler,
} from '@nestjs/cqrs';
import HotelRepositoryStub from './repositories/hotel.repository.stub';
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
import { HOTEL_REPOSITORY } from './repositories/hotel.repository.interface';
import { ClientArrivesCommandHandler } from './commands/handlers/client-arrives.command.handler';
import { ClientArrivedEventHandler } from './events/handlers/client-arrived.event.handler';
import { ClientLeavedEventHandler } from './events/handlers/client-leaved.event.handler';
import { ClientPaidEventHandler } from './events/handlers/client-paid.event.handler';
import { RoomCleanedEventHandler } from './events/handlers/room-cleaned.event.handler';
import { PayBillCommandHandler } from './commands/handlers/pay-bill-command.handler';
import CheckoutRoomQueryHandler from './queries/handlers/checkout-room.query.handler';
import GetClientRoomQueryHandler from './queries/handlers/get-client-room.query.handler';
import GetClientReceiptQueryHandler from './queries/handlers/get-client-receipt.query.handler';
import ESEventBus from './extention/es-event-bus';
import { GrpcEventStoreConfig } from '@nestjs-geteventstore/event-store/config/grpc/grpc-event-store-config';
import { EventStoreModule } from '@nestjs-geteventstore/event-store/event-store.module';
import { IEventStoreConfig } from '@nestjs-geteventstore/event-store/config';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';
import ESEvent from './extention/es-event';
import GetHotelStateQueryHandler from './queries/handlers/get-hotel-state.query.handler';

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

export const CommandHandlers: Type<ICommandHandler>[] = [
  ClientReservesRoomCommandHandler,
  NotifyClientCommandHandler,

  ClientArrivesCommandHandler,

  PayBillCommandHandler,
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

  ClientLeavedEventHandler,
  ClientPaidEventHandler,
  RoomCleanedEventHandler,
];

export const AdaptersHandlers = [
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
    CqrsModule,
    EventStoreModule.register(eventStoreConfig as IEventStoreConfig, {}),
  ],
  controllers: [HotelRoomController],
  providers: [
    ExplorerService,
    {
      provide: HOTEL_REPOSITORY,
      useClass: HotelRepositoryStub,
    },
    ...QueryHandlers,
    ...CommandHandlers,
    ...EventsHandlers,
    ...AdaptersHandlers,
    ESEventBus,
  ],
})
export default class HotelRoomModule<EventBase extends ESEvent = ESEvent>
  implements OnApplicationBootstrap
{
  constructor(private readonly eventsBus: ESEventBus<EventBase>) {}

  public onApplicationBootstrap(): void {
    this.eventsBus.register(EventsHandlers);
  }
}
