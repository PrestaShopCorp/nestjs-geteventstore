import { EventMetadataDto } from '../dto';

export const createEventDefaultMetadata = () =>
  ({
    time: Math.floor(new Date().getTime() / 1000),
    version: 1,
  } as Partial<EventMetadataDto>);
