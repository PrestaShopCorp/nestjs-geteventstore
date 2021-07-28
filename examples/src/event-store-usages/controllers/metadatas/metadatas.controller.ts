import { Body, Controller, Get, Optional, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { ExpectedRevision } from '@nestjs-geteventstore/event-store/events';
import { AppendResult } from '@eventstore/db-client';
import MetadatasDto from './metadatas-dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('metadatas')
export default class MetadatasController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('write/:streamname')
  public writeMetadatas(
    @Optional() @Param('streamname') streamName = '$test-stream',
    @Body() metadatasDto: MetadatasDto,
  ): Observable<{ success: boolean }> {
    return this.eventStoreService
      .writeMetadata(streamName, ExpectedRevision.Any, metadatasDto)
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
