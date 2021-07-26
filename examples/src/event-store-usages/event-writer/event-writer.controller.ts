import { Controller, Get } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { v4 } from 'uuid';
import { IWriteEvent } from '@nestjs-geteventstore/interfaces';

@Controller('event-writer')
export default class EventWriterController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get()
  public async test(): Promise<IWriteEvent> {
    const event: IWriteEvent = {
      data: {
        id: 5,
        value: 'This event was sent at ' + new Date(),
      },
      eventId: v4(),
      eventType: 'MACHAO',
    };

    await this.eventStoreService.writeEvents('$ce-hero', [event]);

    return event;
  }
}
