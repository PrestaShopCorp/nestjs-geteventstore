import { Injectable } from '@nestjs/common';
import { ClientNotifier } from '../domain/ports/client-notifier';
import HouseMaid from '../domain/ports/house-maid';
import { RoomRegistry } from '../domain/ports/room-registry';
import Room from '../domain/room';
import HotelRepository from './hotel.repository.interface';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import Hotel from '../domain/hotel';

@Injectable()
export default class HotelRepositoryStub implements HotelRepository {
  private availableRoomNumbers: number[] = [101, 102, 103];

  private usedRoomNumbers: Map<string, number> = new Map();

  private accounting: Map<string, number> = new Map();

  public async getHotel(
    roomRegistryHandler: RoomRegistry,
    clientNotifierHandler: ClientNotifier,
    houseMaidHandler: HouseMaid,
  ): Promise<Hotel> {
    return new Hotel(
      roomRegistryHandler,
      clientNotifierHandler,
      houseMaidHandler,
    );
  }

  public async getAvailableRoom(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<Room | null> {
    if (this.availableRoomNumbers.length === 0) {
      return null;
    }
    const availableRoomNumber: number = this.availableRoomNumbers.pop();
    this.usedRoomNumbers.set(clientId, availableRoomNumber);

    return new Room(availableRoomNumber);
  }

  public async findRoomNumber(clientId: string): Promise<number> {
    const roomNumber: number = this.usedRoomNumbers.get(clientId);

    if (isUndefined(roomNumber))
      throw new Error(`Client has not reserved a room`);

    return roomNumber;
  }

  public async getClientRoom(clientId: string): Promise<Room> {
    const roomNumber: number = this.usedRoomNumbers.get(clientId);
    if (!roomNumber) {
      throw Error('Client is in no room');
    }
    return new Room(roomNumber);
  }

  public registerBill(clientId: string, billAmount: number): void {
    this.accounting.set(clientId, billAmount);
  }

  public getClientReceipt(clientId: string): number {
    const bill: number = this.accounting.get(clientId);
    if (!bill) {
      throw Error('Client has not paid any bill in the hotel');
    }
    return bill;
  }
}
