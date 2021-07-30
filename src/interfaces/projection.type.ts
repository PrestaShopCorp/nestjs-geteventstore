export type EventStoreProjection = {
  name: string;
  content?: string;
  file?: string;

  // 'transient' mode won't work with deprecated connector
  mode?: 'oneTime' | 'continuous' | 'transient';
  trackEmittedStreams?: boolean;
  enabled?: boolean;
  checkPointsEnabled?: boolean;
  emitEnabled?: boolean;
};
