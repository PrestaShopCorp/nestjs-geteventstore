import { ValidateNested, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
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
  metadata: EventMetadataDto;

  @ValidateNested()
  data: any;
}
