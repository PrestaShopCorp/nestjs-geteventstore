import { EventMetadataDto } from '../dto';

/**
 * @see https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#type
 */
export const createDefaultMetadata = () =>
  ({
    time: Math.floor(new Date().getTime() / 1000),
    version: 1,
    specversion: 1,
  } as EventMetadataDto);
