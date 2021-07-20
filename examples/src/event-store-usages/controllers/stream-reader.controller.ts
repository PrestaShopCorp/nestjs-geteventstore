import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
  Param,
} from '@nestjs/common';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/event-store.service.interface';
import { ResolvedEvent, StreamingRead } from '@eventstore/db-client';

@Controller('stream-reader')
export default class StreamReaderController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

  @Get(':streamname?')
  public async readOnStream(
    @Optional() @Param('streamname') streamName = '$test-stream',
  ): Promise<StreamingRead<ResolvedEvent>> {
    try {
      return await this.eventStoreService.readFromStream(streamName, {
        direction: 'forwards',
        fromRevision: 'start',
        maxCount: 10,
      });
    } catch (error) {
      if (error.type == 'stream-not-found') {
        throw new HttpException(
          'The stream does not exist.',
          HttpStatus.FORBIDDEN,
        );
      }

      throw error;
    }
  }
}
