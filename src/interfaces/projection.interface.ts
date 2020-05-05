import { ProjectionMode } from 'geteventstore-promise';

export type IEventStoreProjection = {
  name: string,
  content?: string,
  file?: string,
  mode?: ProjectionMode,
  enabled?: boolean,
  checkPointsEnabled?: boolean,
  emitEnabled?: boolean,
};
