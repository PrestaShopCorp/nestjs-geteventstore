import { Module } from '@nestjs/common';
import HotelRoomController from './hotel-room.controller';

@Module({
  imports: [],
  controllers: [HotelRoomController],
})
export default class HotelRoomModule {}
