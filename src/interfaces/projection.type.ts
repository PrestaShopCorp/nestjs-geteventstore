import { ProjectionMode } from 'geteventstore-promise';

export type EventStoreProjectionType = {
  name: string;
  content?: string;
  file?: string;
  mode?: ProjectionMode;
  trackEmittedStreams?: boolean;
  enabled?: boolean;
  checkPointsEnabled?: boolean;
  emitEnabled?: boolean;
};
