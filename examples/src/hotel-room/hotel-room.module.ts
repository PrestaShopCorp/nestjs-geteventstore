import { Module } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';
import { CqrsModule } from '@nestjs/cqrs';
import HotelRepositoryStub from './repositories/hotel.repository.stub';
import RoomRegistryHandler from './adapters/room-registry.handler';
import HouseMaidHandler from './adapters/house-maid.handler';
import ClientNotifierHandler from './adapters/client-notifier.handler';
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

export const CommandHandlers = [
  ClientReservesRoomCommandHandler,
  NotifyClientCommandHandler,

  ClientArrivesCommandHandler,

  PayBillCommandHandler,
];

export const QueryHandlers = [
  CheckoutRoomQueryHandler,
  GetClientRoomQueryHandler,
  GetClientReceiptQueryHandler,
];

export const EventsHandlers = [
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
    useClass: RoomRegistryHandler,
  },
  {
    provide: HOUSE_MAID,
    useClass: HouseMaidHandler,
  },
  {
    provide: CLIENT_NOTIFIER,
    useClass: ClientNotifierHandler,
  },
];

@Module({
  imports: [CqrsModule],
  controllers: [HotelRoomController],
  providers: [
    {
      provide: HOTEL_REPOSITORY,
      useClass: HotelRepositoryStub,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventsHandlers,
    ...AdaptersHandlers,
  ],
})
export default class HotelRoomModule {}
