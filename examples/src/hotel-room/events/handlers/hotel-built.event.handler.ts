import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { HotelBuiltEvent } from '../impl/hotel-built.event';

@EventsHandler(HotelBuiltEvent)
export class HotelBuiltEventHandler implements IEventHandler<HotelBuiltEvent> {
  private readonly logger = new Logger(this.constructor.name);

  public handle(event: HotelBuiltEvent): void {
    this.logger.debug(`Async HotelBuildEvent... `);
  }
}
