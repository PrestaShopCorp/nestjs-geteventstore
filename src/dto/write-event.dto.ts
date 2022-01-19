import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { EventMetadataDto } from './event-metadata.dto';

export class WriteEventDto {
  // TODO Vincent IsUuid ?
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  eventType: string;

  @ValidateNested()
  @Type(() => EventMetadataDto)
  metadata: Partial<EventMetadataDto>; // we add partial to allow metadata auto-generation

  @ValidateNested()
  data: any;
}
