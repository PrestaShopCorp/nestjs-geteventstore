import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HOTEL_REPOSITORY } from '../../repositories/hotel.repository.interface';
import HotelRepository from '../../repositories/hotel.repository.stub';
import QueryResponse from '../response/query.response';
import GetHotelStateQuery from '../impl/get-hotel-state.query';

@QueryHandler(GetHotelStateQuery)
export default class GetHotelStateQueryHandler
  implements IQueryHandler<GetHotelStateQuery>
{
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,
  ) {}

  public async execute(): Promise<QueryResponse> {
    this.logger.debug('Async GetHotelStateQuery...');

    const nbAvailableRooms: number = this.repository.getNbAvailableRooms();

    this.logger.debug(`Hotel free rooms : ${nbAvailableRooms}`);

    return {
      result: {
        nbAvailableRooms,
      },
    };
  }
}
