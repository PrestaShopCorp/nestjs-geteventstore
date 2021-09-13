import { EventData } from '@eventstore/db-client/dist/types/events';
import { AppendToStreamOptions } from '@eventstore/db-client/dist/streams';

export default interface EventBatch {
  stream: string;
  events: EventData[];
  expectedVersion: AppendToStreamOptions;
}
