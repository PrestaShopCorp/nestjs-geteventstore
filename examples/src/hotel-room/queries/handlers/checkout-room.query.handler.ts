import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import CheckoutRoomQuery from '../impl/checkout-room.query';
import { Inject, Logger } from '@nestjs/common';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';
import HotelRepository, {
  HOTEL_REPOSITORY,
} from '../../repositories/hotel.repository.interface';
import QueryResponse from '../response/query.response';

@QueryHandler(CheckoutRoomQuery)
export default class CheckoutRoomQueryHandler
  implements IQueryHandler<CheckoutRoomQuery>
{
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @Inject(ROOM_REGISTRY)
    private readonly roomRegistryHandler: RoomRegistry,
    @Inject(CLIENT_NOTIFIER)
    private readonly clientNotifierHandler: ClientNotifier,
    @Inject(HOUSE_MAID)
    private readonly houseMaidHandler: HouseMaid,
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,
  ) {}

  public async execute(query: CheckoutRoomQuery): Promise<QueryResponse> {
    this.logger.debug('Async CheckoutRoomQuery...');
    const { roomNumber } = query;
    const checkoutResult = await this.repository.checksTheRoomOut(roomNumber);
    return {
      result: {
        roomNumber: roomNumber,
        checkout: checkoutResult,
      },
    };
  }
}
