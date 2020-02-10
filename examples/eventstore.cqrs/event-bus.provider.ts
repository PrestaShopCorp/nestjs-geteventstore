import {
  AcknowledgeEventStoreEvent,
  EventStoreBusConfig,
  EventStoreEvent,
  EventStoreSubscriptionType,
} from '../../src/index';

export class PersonAddedEvent extends AcknowledgeEventStoreEvent {
}

const PersonEventInstantiators = {
  PersonAddedEvent: (event: EventStoreEvent) => {
    return new PersonAddedEvent({
      data: event.data,
      metadata: event.metadata,
      eventStreamId: event.eventStreamId,
    });
  },
};
/*
const eventBuilderFactory = (type, event) => {
  const className = `${type}Event`;
  return new className(event);
};
*/

export const eventStoreBusConfig: EventStoreBusConfig = {
  subscriptions: [
    {
      type: EventStoreSubscriptionType.Persistent,
      stream: '$ce-persons',
      group: 'contacts',
    },
  ],
  // TODO use a factory that search the events automatically
  eventInstantiators: {
    ...PersonEventInstantiators,
  },
};
