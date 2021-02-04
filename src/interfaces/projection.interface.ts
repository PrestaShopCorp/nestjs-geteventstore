import { ProjectionMode } from 'geteventstore-promise';
import {IProjectionProvider} from "./projection-provider.interface";

export type IEventStoreProjection = {
  name: string;
  content?: string;
  provider?: string;
  file?: string;
  mode?: ProjectionMode;
  trackEmittedStreams?: boolean;
  enabled?: boolean;
  checkPointsEnabled?: boolean;
  emitEnabled?: boolean;
};
