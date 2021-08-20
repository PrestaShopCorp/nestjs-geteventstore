import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import HotelRepository from './hotel.repository.interface';
import { Client } from '@eventstore/db-client/dist/Client';
import { EVENT_STORE_CONNECTOR } from '@nestjs-geteventstore/cqrs2';
import { HOTEL_STREAM_NAME } from '../hotel-stream.constants';
import { HotelBuiltEvent } from '../events/impl/hotel-built.event';
import { ClientReservedRoomEvent } from '../events/impl/client-reserved-room.event';
import { ClientPaidEvent } from '../events/impl/client-paid.event';

@Injectable()
export default class HotelEventStore implements HotelRepository, OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private rooms = new Map<string, number>();
  private nbAvailableRooms = 0;
  private nbHotelRooms = 0;

  private clientLastBills = new Map<string, number>();

  constructor(
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStoreConnector: Client,
  ) {}

  public async onModuleInit(): Promise<void> {
    this.replayAllEvents().then(() =>
      this.logger.debug('EventStore Repository initialized'),
    );
  }

  private async replayAllEvents(): Promise<void> {
    const subscription = this.eventStoreConnector.subscribeToStream<any>(
      HOTEL_STREAM_NAME,
      { fromRevision: 'start' },
    );

    for await (const resolvedEvent of subscription) {
      const eventType = resolvedEvent.event.type;
      if (eventType === HotelBuiltEvent.name) {
        const { nbRooms } = resolvedEvent.event.data[
          'event'
        ] as HotelBuiltEvent;
        this.rebuildHotel(nbRooms);
        // Console.log only for example showcase
        console.log('HotelBuiltEvent : ', this.rooms.entries());
      }
      if (eventType === ClientReservedRoomEvent.name) {
        const { clientId, roomNumber } = resolvedEvent.event.data[
          'event'
        ] as ClientReservedRoomEvent;
        this.rooms.set(clientId, roomNumber);
        this.nbAvailableRooms--;
        // Console.log only for example showcase
        console.log('ClientReservedRoomEvent : ', this.rooms.entries());
      }
      if (eventType === ClientPaidEvent.name) {
        const { clientId, bill } = resolvedEvent.event.data[
          'event'
        ] as ClientPaidEvent;
        this.rooms.delete(clientId);
        this.nbAvailableRooms++;
        this.clientLastBills.set(clientId, bill);
        // Console.log only for example showcase
        console.log('ClientPaidEvent : ', this.rooms.entries());
      }
    }
  }

  private rebuildHotel(nbRooms: number) {
    this.rooms.clear();
    this.nbHotelRooms = nbRooms;
    this.nbAvailableRooms = nbRooms;
  }

  public async checksTheRoomOut(
    roomNumber: number,
  ): Promise<'allIsOk' | 'towelsMissing'> {
    return Math.floor(Math.random() * 2) === 0 ? 'allIsOk' : 'towelsMissing';
  }

  public async getAvailableRoomNumber(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<number | null> {
    if (this.nbAvailableRooms === 0) return null;
    return this.nbAvailableRooms;
  }

  public async getClientRoom(clientId: string): Promise<number> {
    return this.rooms.get(clientId);
  }

  public async getNbAvailableRooms(): Promise<number> {
    return this.nbAvailableRooms;
  }

  public findRoomNumber(clientId: string): Promise<number> {
    return this.getClientRoom(clientId);
  }

  public getClientReceipt(clientId: string): number {
    return this.clientLastBills.get(clientId);
  }
}
