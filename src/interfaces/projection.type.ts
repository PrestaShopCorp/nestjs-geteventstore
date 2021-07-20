export type EventStoreProjection = {
  name: string;
  content?: string;
  file?: string;

  mode?: 'oneTime' | 'continuous' | 'transient';
  trackEmittedStreams?: boolean;
  enabled?: boolean;
  checkPointsEnabled?: boolean;
  emitEnabled?: boolean;
};
