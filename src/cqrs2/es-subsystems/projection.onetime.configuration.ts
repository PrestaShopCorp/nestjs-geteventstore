import { ProjectionConfiguration } from './projection.configuration';
import { Client } from '@eventstore/db-client/dist/Client';
import { readFileSync } from 'fs';

export class ProjectionOnetimeConfiguration implements ProjectionConfiguration {
  constructor(public content: string) {}

  public static fromFile(filePath: string): ProjectionOnetimeConfiguration {
    const content = readFileSync(filePath, 'utf8');
    return new ProjectionOnetimeConfiguration(content);
  }

  public async assert(eventStoreConnector: Client): Promise<void> {
    await eventStoreConnector.createOneTimeProjection(this.content);
  }
}
