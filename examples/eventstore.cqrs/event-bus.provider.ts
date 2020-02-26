import {
  AcknowledgeEventStoreEvent, defaultMapper,
  EventStoreBusConfig,
  EventStoreEvent,
  TEventStoreEvent,
} from '../../src/index';
import { Logger } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';

const logger = new Logger('EventBus')

export class PersonAddedEvent extends AcknowledgeEventStoreEvent implements IEvent{
}
const allEvents = {
  ...PersonAddedEvent
}

export const eventStoreBusConfig: EventStoreBusConfig = {
  subscriptions: {
    persistent: [{
      stream: '$ce-persons',
      group: 'contacts',
    }]
  },
  eventMapper: defaultMapper(allEvents)
};
