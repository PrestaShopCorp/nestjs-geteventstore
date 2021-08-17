import { Inject, Injectable, Logger } from '@nestjs/common';
import HotelRepository from './hotel.repository.interface';
import { Client } from '@eventstore/db-client/dist/Client';
import { STARTING_ROOM_INDEX, TOTAL_NUMBER_OF_ROOMS } from '../hotel.constant';

export const EVENT_STORE_CONNECTOR = Symbol();

@Injectable()
export default class HotelEventStore implements HotelRepository {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStoreConnector: Client,
  ) {
    this.logger.debug('EventStore Repository initialized');
  }

  public async checksTheRoomOut(
    roomNumber: number,
  ): Promise<'allIsOk' | 'towelsMissing'> {
    return Math.floor(Math.random() * 2) === 0 ? 'allIsOk' : 'towelsMissing';
  }

  public getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<number | null> {
    return Promise.resolve(undefined);
  }

  public async getClientRoom(clientId: string): Promise<number> {
    const roomUsage = await this.eventStoreConnector.getProjectionState(
      'hotel-state-projection',
    );
    const allocatedRooms = (roomUsage as { rooms: [string] }).rooms;
    let clientRoom = null;
    allocatedRooms.forEach((client: string, index: number) => {
      if (clientId === client) {
        clientRoom = index + STARTING_ROOM_INDEX;
      }
    });
    return clientRoom;
  }

  public async getNbAvailableRooms(): Promise<number> {
    const roomUsage = await this.eventStoreConnector.getProjectionState(
      'hotel-state-projection',
    );
    return (
      (roomUsage as { rooms: [[number, string]] }).rooms.length -
      TOTAL_NUMBER_OF_ROOMS
    );
  }

  public findRoomNumber(clientId: string): Promise<number> {
    return Promise.resolve(0);
  }

  public registerBill(clientId: string, billAmount: number): void {}

  public freeRoom(clientId: string): void {}

  public getClientReceipt(clientId: string): number {
    return 0;
  }
}
