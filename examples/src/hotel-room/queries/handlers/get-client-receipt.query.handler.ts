import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import HotelRepository from '../../repositories/hotel.repository.stub';
import QueryResponse from '../response/query.response';
import GetClientRoomQuery from '../impl/get-client-room.query';
import GetClientReceiptQuery from '../impl/get-client-receipt.query';

@QueryHandler(GetClientReceiptQuery)
export default class GetClientReceiptQueryHandler
  implements IQueryHandler<GetClientReceiptQuery>
{
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,
  ) {}

  public async execute(query: GetClientRoomQuery): Promise<QueryResponse> {
    this.logger.log('Async GetClientRoomQuery...');
    try {
      const receipt: number = this.repository.getClientReceipt(query.clientId);
      return {
        result: {
          bill: receipt,
        },
      };
    } catch (e) {
      return {
        result: 'Fail : Client was not in the hotel',
      };
    }
  }
}
