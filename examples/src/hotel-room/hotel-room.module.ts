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
import { NotifyClientEventHandler } from './events/handlers/notify-client.event.handler';
import { ClientReservesRoomCommandHandler } from './commands/handlers/client-reserves-room.command.handler';
import { NotifyClientCommandHandler } from './commands/handlers/notify-client.command.handler';
import { ClientReservesRoomEventHandler } from './events/handlers/client-reserves-room.event.handler';
import { HOTEL_REPOSITORY } from './repositories/hotel.repository.interface';
import { ClientArrivesCommandHandler } from './commands/handlers/client-arrives.command.handler';
import { ClientArrivesEventHandler } from './events/handlers/client-arrives.event.handler';

export const CommandHandlers = [
  ClientReservesRoomCommandHandler,
  NotifyClientCommandHandler,

  ClientArrivesCommandHandler,
];

export const EventsHandlers = [
  ClientReservesRoomEventHandler,
  NotifyClientEventHandler,

  ClientArrivesEventHandler,
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
    ...EventsHandlers,
    ...AdaptersHandlers,
  ],
})
export default class HotelRoomModule {}
