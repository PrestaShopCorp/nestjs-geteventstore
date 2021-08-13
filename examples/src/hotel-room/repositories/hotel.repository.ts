import { Injectable } from '@nestjs/common';
import { HotelAgreggate } from '../hotel.agreggate';

@Injectable()
export default class HotelRepository {
  public async getHotel() {
    return new HotelAgreggate('1234');
  }
}
