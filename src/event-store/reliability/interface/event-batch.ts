import { AppendToStreamOptions } from '@eventstore/db-client/dist/streams';
import { EventData } from '@eventstore/db-client/dist/types/events';

export default interface EventBatch {
  stream: string;
  events: EventData[];
  expectedVersion: AppendToStreamOptions;
}
