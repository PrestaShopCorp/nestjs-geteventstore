import { Module } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientReservesRoomEvent } from './events/impl/client-reserves-room.event';
import HotelRepository from './repositories/hotel.repository';
import { ClientReservesRoomHandler } from './commands/handlers/client-reserves-room.handler';

export const CommandHandlers = [ClientReservesRoomHandler];

export const EventsHandlers = [ClientReservesRoomEvent];

@Module({
  imports: [CqrsModule],
  controllers: [HotelRoomController],
  providers: [HotelRepository, ...CommandHandlers, ...EventsHandlers],
})
export default class HotelRoomModule {}
