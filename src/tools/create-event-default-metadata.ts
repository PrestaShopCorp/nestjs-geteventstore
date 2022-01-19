import { EventMetadataDto } from '../dto';

export const createEventDefaultMetadata = (): Partial<EventMetadataDto> =>
  ({
    time: new Date().toISOString(),
    version: 1,
  } as Partial<EventMetadataDto>);
