import { Body, Controller, Get, Inject, Optional, Param } from '@nestjs/common';
import MetadatasDto from './metadatas-dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/event-store.service.interface';
import { AppendResult } from '@eventstore/db-client/dist/types';
import * as constants from '@eventstore/db-client/dist/constants';

@Controller('metadatas')
export default class MetadatasController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

  @Get('write/:streamname')
  public writeMetadatas(
    @Optional() @Param('streamname') streamName = '$test-stream',
    @Body() metadatasDto: MetadatasDto,
  ): Observable<{ success: boolean }> {
    return this.eventStoreService
      .writeMetadata(streamName, constants.ANY, metadatasDto)
      .pipe(
        map((res: AppendResult): { success: boolean } => {
          return {
            success: res.success,
          };
        }),
      );
  }

  @Get('read/:streamname')
  public readMetadatas(
    @Optional() @Param('streamname') streamName = '$test-stream',
  ): Observable<any> {
    return this.eventStoreService.readMetadata(streamName);
  }
}
