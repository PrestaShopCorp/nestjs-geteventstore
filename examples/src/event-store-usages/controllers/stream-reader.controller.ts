import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
  Param,
} from '@nestjs/common';
import { IBaseEvent } from '@nestjs-geteventstore/interfaces';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/interfaces/event-store.service.interface';

@Controller('stream-reader')
export default class StreamReaderController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

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
