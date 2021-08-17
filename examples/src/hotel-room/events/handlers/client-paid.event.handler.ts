import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ClientPaidEvent } from '../impl/client-paid.event';
import HotelRepository, {
  HOTEL_REPOSITORY,
} from '../../repositories/hotel.repository.interface';

@EventsHandler(ClientPaidEvent)
export class ClientPaidEventHandler implements IEventHandler<ClientPaidEvent> {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(HOTEL_REPOSITORY)
    private readonly repository: HotelRepository,
  ) {}

  public handle(event: ClientPaidEvent): void {
    this.logger.debug(
      `Async ClientPayEventHandler... client : ${event.clientId} paid ${event.bill}`,
    );
    this.repository.freeRoom(event.clientId);
  }
}
