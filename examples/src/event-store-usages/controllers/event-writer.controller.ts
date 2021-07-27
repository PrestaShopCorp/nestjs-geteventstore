import { Controller, Get, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { v4 } from 'uuid';
import { IWriteEvent } from '@nestjs-geteventstore/interfaces';

@Controller('event-writer')
export default class EventWriterController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('write-one-event/:streamname?')
  public async writeOneEvent(
    @Param('streamname') streamName = '$test-stream',
  ): Promise<IWriteEvent> {
    const event: IWriteEvent = {
      data: {
        id: 1,
        value: 'This event was sent at ' + new Date(),
      },
      eventId: v4(),
      eventType: 'single-event',
    };

    await this.eventStoreService.writeEvents(streamName, [event]);

    return event;
  }

  @Get('write-event-batch/:streamname?')
  public async writeEventBatch(
    @Param('streamname') streamName = '$test-stream',
  ): Promise<IWriteEvent[]> {
    const eventBatch: IWriteEvent[] = EventWriterController.getEventBatch(10);
    await this.eventStoreService.writeEvents(streamName, eventBatch);

    return eventBatch;
  }

  private static getEventBatch(nbEvents: number): IWriteEvent[] {
    const batch: IWriteEvent[] = [];

    for (let i = 0; i < nbEvents; i++) {
      batch.push({
        data: {
          id: i,
          value: 'This event was sent at ' + new Date(),
        },
        eventId: v4(),
        eventType: 'batch-event',
      });
    }

    return batch;
  }
}
