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
      eventType: 'eventtype',
    };

    await this.eventStoreService.writeEvents(streamName, [event]);

    return event;
  }

  @Get('write-event-batch/:streamname?/:eventtype?')
  public async writeEventBatch(
    @Param('streamname') streamName = '$test-stream',
    @Param('eventtype') eventType = 'batch-event',
  ): Promise<IWriteEvent[]> {
    const eventBatch: IWriteEvent[] = EventWriterController.getEventBatch(
      10,
      eventType,
    );
    await this.eventStoreService.writeEvents(streamName, eventBatch);

    return eventBatch;
  }

  private static getEventBatch(
    nbEvents: number,
    eventType: string,
  ): IWriteEvent[] {
    const batch: IWriteEvent[] = [];

    for (let i = 0; i < nbEvents; i++) {
      batch.push({
        data: {
          id: i,
          value: 'This event was sent at ' + new Date(),
        },
        eventId: v4(),
        eventType: eventType,
      });
    }

    return batch;
  }
}
