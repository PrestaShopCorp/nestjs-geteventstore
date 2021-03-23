import { v4 } from 'uuid';
import { EventMetadataDto } from '../dto';

export const createDefaultMetadata = () =>
  ({
    // TODO JDM and Vincent : do we add a default correlation_id ?
    correlation_id: v4(),
    time: Math.floor(new Date().getTime() / 1000),
    version: 1,
    specversion: 1,
  } as EventMetadataDto);
