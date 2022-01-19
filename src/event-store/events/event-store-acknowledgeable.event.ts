import { IAcknowledgeableEvent } from '../../interfaces';
import { EventStoreEvent } from './index';

export abstract class EventStoreAcknowledgeableEvent
  extends EventStoreEvent
  implements IAcknowledgeableEvent
{
  ack(): Promise<void> {
    return Promise.resolve();
  }
  nack(): Promise<void> {
    return Promise.resolve();
  }
}
