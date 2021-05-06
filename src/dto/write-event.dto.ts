import { ValidateNested, IsNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { EventMetadataDto } from './event-metadata.dto';

export class WriteEventDto {
  // TODO Vincent IsUuid ?
  @IsNotEmpty()
  eventId: string;

  @IsNotEmpty()
  eventType: string;

  @IsObject()
  data: object = {};

  @ValidateNested()
  @Type(() => EventMetadataDto)
  metadata: EventMetadataDto;
}
