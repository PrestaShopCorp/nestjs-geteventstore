import { EventStoreProjection } from './projection';
import { Client } from '@eventstore/db-client/dist/Client';
import { readFileSync } from 'fs';

export class ProjectionOnetime implements EventStoreProjection {
  constructor(public content: string) {}

  public static fromFile(filePath: string): ProjectionOnetime {
    const content = readFileSync(filePath, 'utf8');
    return new ProjectionOnetime(content);
  }

  public async assert(eventStoreConnector: Client): Promise<void> {
    await eventStoreConnector.createOneTimeProjection(this.content);
  }
}
