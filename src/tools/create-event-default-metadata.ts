import { EventMetadataDto } from '../dto';

export const createEventDefaultMetadata = () =>
  ({
    time: new Date().toISOString(),
    version: 1,
  } as Partial<EventMetadataDto>);
