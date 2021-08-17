import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import HotelRepository, {
  HOTEL_REPOSITORY,
} from '../../repositories/hotel.repository.interface';
import QueryResponse from '../response/query.response';
import GetClientRoomQuery from '../impl/get-client-room.query';

@QueryHandler(GetClientRoomQuery)
export default class GetClientRoomQueryHandler
  implements IQueryHandler<GetClientRoomQuery>
{
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,
  ) {}

  public async execute(query: GetClientRoomQuery): Promise<QueryResponse> {
    this.logger.debug('Async GetClientRoomQuery...');
    const { clientId } = query;

    const clientRoomNumber: number = await this.repository.getClientRoom(
      clientId,
    );

    return {
      result: {
        clientRoomNumber,
      },
    };
  }
}
