import { AggregateRoot } from '@nestjs/cqrs';
import { ClientReservedRoomEvent } from './events/impl/client-reserved-room.event';
import { Inject, Logger } from '@nestjs/common';
import { ROOM_REGISTRY, RoomRegistry } from './domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from './domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from './domain/ports/house-maid';
import Hotel from './domain/hotel';
import Client from './domain/client';
import Room from './domain/room';
import { ClientNotifiedEvent } from './events/impl/client-notified.event';
import { ClientArrivedEvent } from './events/impl/client-arrived.event';
import { ClientLeavedEvent } from './events/impl/client-leaved.event';
import { ClientPaidEvent } from './events/impl/client-paid.event';
import { RoomCleanedEvent } from './events/impl/room-cleaned.event';

export class HotelAgreggate extends AggregateRoot {
  private readonly logger = new Logger(this.constructor.name);

  private model: Hotel;

  constructor(
    private readonly id: string,
    @Inject(ROOM_REGISTRY)
    private readonly roomRegistryHandler: RoomRegistry,
    @Inject(CLIENT_NOTIFIER)
    private readonly clientNotifierHandler: ClientNotifier,
    @Inject(HOUSE_MAID)
    private readonly houseMaidHandler: HouseMaid,
  ) {
    super();
    this.model = new Hotel(
      roomRegistryHandler,
      clientNotifierHandler,
      houseMaidHandler,
    );
  }

  async reserveRoom(clientId: string, dateArrival: Date, dateLeaving: Date) {
    this.logger.log('HotelAgreggate client reserves a room');
    const client = new Client(clientId);
    const room: Room = await this.model.reserveRoom(
      client,
      dateArrival,
      dateLeaving,
    );
    this.apply(
      new ClientReservedRoomEvent(client, room, dateArrival, dateLeaving),
    );
    return room;
  }

  async notifyClient(clientId: string, dateArrival: Date, dateLeaving: Date) {
    this.logger.log('HotelAgreggate notifyClient -> email sent');
    this.apply(new ClientNotifiedEvent(clientId, dateArrival, dateLeaving));
  }

  async clientArrives(clientId: string) {
    this.logger.log('HotelAgreggate client arrives');
    const roomNumber: number = await this.model.givesKeyToClient(
      new Client(clientId),
    );
    this.apply(new ClientArrivedEvent(clientId, roomNumber));
  }

  public async clientLeaves(clientId: string) {
    this.logger.log('HotelAgreggate client leaves');
    const clientRoomNumber: number = await this.model.findKey(clientId);
    const room: Room = new Room(clientRoomNumber);

    const checkout: 'allIsOk' | 'towelsMissing' =
      await this.model.checksTheRoomOut(room);
    this.apply(new ClientLeavedEvent(clientId, room.getNumber()));

    const bill: number = checkout === 'allIsOk' ? 100 : 110;

    this.model
      .makesTheClientPay(new Client(clientId), bill)
      .then(() => this.apply(new ClientPaidEvent(clientId, bill)));

    this.model
      .cleansTheRoom(room)
      .then(() => this.apply(new RoomCleanedEvent(room.getNumber(), checkout)));
  }
}
