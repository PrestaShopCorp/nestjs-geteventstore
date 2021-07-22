import { ProjectionMode } from 'geteventstore-promise';

export type EventStoreProjection = {
  name: string;
  content?: string;
  file?: string;
  mode?: ProjectionMode;
  trackEmittedStreams?: boolean;
  enabled?: boolean;
  checkPointsEnabled?: boolean;
  emitEnabled?: boolean;
};
