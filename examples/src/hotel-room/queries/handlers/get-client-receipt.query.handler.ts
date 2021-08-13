import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ROOM_REGISTRY, RoomRegistry } from '../../domain/ports/room-registry';
import {
  CLIENT_NOTIFIER,
  ClientNotifier,
} from '../../domain/ports/client-notifier';
import HouseMaid, { HOUSE_MAID } from '../../domain/ports/house-maid';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import HotelRepository from '../../repositories/hotel.repository.stub';
import QueryResponse from '../response/query.response';
import GetClientRoomQuery from '../impl/get-client-room.query';
import GetClientReceiptQuery from '../impl/get-client-receipt.query';

@QueryHandler(GetClientReceiptQuery)
export default class GetClientReceiptQueryHandler
  implements IQueryHandler<GetClientReceiptQuery>
{
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

  public async execute(query: GetClientRoomQuery): Promise<QueryResponse> {
    const receipt: number = this.repository.getClientReceipt(query.clientId);

    return {
      result: {
        bill: receipt,
      },
    };
  }
}
