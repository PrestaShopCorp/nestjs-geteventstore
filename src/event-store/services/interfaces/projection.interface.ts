import { EventStoreProjection } from '../../../interfaces';

export interface IProjectionService {
  assertProjections(projections: EventStoreProjection[]): Promise<void>;

  createProjection(
    query: string,
    type: 'oneTime' | 'continuous' | 'transient',
    projectionName?: string,
    options?: any,
  ): Promise<any>;

  getProjectionState(streamName: string): Promise<any>;

  updateProjections(projections: EventStoreProjection[]): Promise<void>;

  extractProjectionContent(projection: EventStoreProjection): any;
}
