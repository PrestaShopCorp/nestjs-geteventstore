import { Controller, Get, Inject, Param } from '@nestjs/common';
import { v4 } from 'uuid';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/event-store.service.interface';
import { EventData } from '@eventstore/db-client';
import { AppendResult } from '@eventstore/db-client/dist/types';
import * as constants from '@eventstore/db-client/dist/constants';

@Controller('event-writer')
export default class EventWriterController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

  @Get('write-one-event/:streamname?')
  public async writeOneEvent(
    @Param('streamname') streamName = '$test-stream',
  ): Promise<AppendResult> {
    const event: EventData = {
      id: v4(),
      type: 'eventtype',
      contentType: 'application/json',
      data: {
        id: 1,
        value: 'This event was sent at ' + new Date(),
      },
      metadata: {},
    };

    return await this.eventStoreService.writeEvents(
      streamName,
      [event],
      constants.ANY,
    );
  }

  @Get('write-event-batch/:streamname?/:eventtype?')
  public async writeEventBatch(
    @Param('streamname') streamName = '$test-stream',
    @Param('eventtype') eventType = 'batch-event',
  ): Promise<AppendResult> {
    const eventBatch: EventData[] = EventWriterController.getEventBatch(
      10,
      eventType,
    );
    return await this.eventStoreService.writeEvents(
      streamName,
      eventBatch,
      constants.ANY,
    );
  }

  private static getEventBatch(
    nbEvents: number,
    eventType: string,
  ): EventData[] {
    const batch: EventData[] = [];

    for (let i = 0; i < nbEvents; i++) {
      const event: EventData = {
        id: v4(),
        type: 'eventtype',
        contentType: 'application/json',
        data: {
          id: i,
          value: 'This event was sent at ' + new Date(),
        },
        metadata: {},
      };
      batch.push(event);
    }

    return batch;
  }
}
