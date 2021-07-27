import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Optional,
  Param,
} from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { IBaseEvent } from '@nestjs-geteventstore/interfaces';

@Controller('stream-reader')
export default class StreamReaderController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get(':streamname?')
  public async readOnStream(
    @Optional() @Param('streamname') streamName = '$test-stream',
  ): Promise<IBaseEvent[]> {
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
