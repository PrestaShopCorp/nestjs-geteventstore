import { AggregateRoot } from '@nestjs/cqrs';
import { ClientReservesRoomEvent } from './events/impl/client-reserves-room.event';
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
import { NotifyClientEvent } from './events/impl/notify-client.event';

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
    const client = new Client(clientId);
    const room: Room = await this.model.reserveRoom(
      client,
      dateArrival,
      dateLeaving,
    );
    this.apply(
      new ClientReservesRoomEvent(client, room, dateArrival, dateLeaving),
    );
  }

  async notifyClient(clientId: string, dateArrival: Date, dateLeaving: Date) {
    this.logger.log('HotelAgreggate notifyClient -> email sent');
    this.apply(new NotifyClientEvent(clientId, dateArrival, dateLeaving));
  }
}
