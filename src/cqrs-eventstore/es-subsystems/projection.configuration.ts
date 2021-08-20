import { Client } from '@eventstore/db-client/dist/Client';

export abstract class ProjectionConfiguration {
  name?: string;
  content: string;

  // 'transient' mode won't work with deprecated connector
  // mode?: 'oneTime' | 'continuous' | 'transient';
  // trackEmittedStreams?: boolean;
  // enabled?: boolean;
  // checkPointsEnabled?: boolean;
  // emitEnabled?: boolean;

  public abstract assert(eventStoreConnector: Client): Promise<void>;
}
