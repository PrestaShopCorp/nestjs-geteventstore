import { IEvent } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import {
  createEventData,
  EventData,
  EventStoreCatchUpSubscription,
  EventStorePersistentSubscription,
  PersistentSubscriptionNakEventAction,
  ResolvedEvent,
} from 'node-eventstore-client';
import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { EventStore } from '../event-store.class';
import {
  EventStoreBusConfig,
  EventStoreCatchupSubscription as ESCatchUpSubscription,
  EventStorePersistentSubscription as ESPersistentSubscription,
  EventStoreSubscriptionType,
} from './event-bus.provider';

export interface IEventConstructors {
  [key: string]: (...args: any[]) => IEvent;
}

interface ExtendedCatchUpSubscription extends EventStoreCatchUpSubscription {
  isLive: boolean | undefined;
}

interface ExtendedPersistentSubscription
  extends EventStorePersistentSubscription {
  isLive: boolean | undefined;
}

// Todo Define
export class EventStoreEvent implements IEvent {
  data;
  metadata;
  eventId;
  eventType;
  eventStreamId;
  created;
  eventNumber;
  constructor(
    data,
    metadata,
    eventStreamId,
    eventId,
    created,
    eventNumber,
    eventType,
  ) {
    this.data = data;
    this.metadata = metadata;
    this.eventId = eventId;
    this.eventType = eventType;
    this.eventStreamId = eventStreamId;
    this.created = created;
    this.eventNumber = eventNumber;
  }
  getEventId() {
    return this.eventId;
  }

  getEventType() {
    return this.eventType;
  }

  getStream() {
    return this.eventStreamId;
  }

  getStreamCategory() {
    return this.eventStreamId.split('-')[0];
  }

  getStreamId() {
    return this.eventStreamId.replace(/^[^-]*-/, '');
  }
}

export class AcknowledgableEventstoreEvent extends EventStoreEvent {
  originalEvent;
  private subscription: EventStorePersistentSubscription;
  constructor(
    data,
    metadata,
    eventStreamId,
    eventId,
    created = null,
    eventNumber = null,
    eventType = null,
  ) {
    super(data, metadata, eventStreamId, eventId, created, eventNumber, eventType);
    this.originalEvent = {
      eventId,
    };
  }
  setSubscription(sub: EventStorePersistentSubscription) {
    this.subscription = sub;
  }
  ack() {
    const originalEvent = {
      originalEvent: {
        eventId: this.eventId,
      },
    } as ResolvedEvent;

    return this.subscription.acknowledge([originalEvent]);
  }
  nack(action: PersistentSubscriptionNakEventAction, reason: string) {
    return this.subscription.fail(this.originalEvent, action, reason);
  }
}

export class EventStoreBus {
  private eventConstructors: IEventConstructors;
  private logger = new Logger('EventStoreBus');
  private catchupSubscriptions: ExtendedCatchUpSubscription[] = [];
  private catchupSubscriptionsCount: number;

  private persistentSubscriptions: ExtendedPersistentSubscription[] = [];
  private persistentSubscriptionsCount: number;

  constructor(
    private eventStore: EventStore,
    private subject$: Subject<IEvent>,
    config: EventStoreBusConfig,
  ) {
    this.addEventHandlers(config.eventInstantiators);

    const catchupSubscriptions = config.subscriptions.filter(sub => {
      return sub.type === EventStoreSubscriptionType.CatchUp;
    });

    const persistentSubscriptions = config.subscriptions.filter(sub => {
      return sub.type === EventStoreSubscriptionType.Persistent;
    });

    this.subscribeToCatchUpSubscriptions(
      catchupSubscriptions as ESCatchUpSubscription[],
    );

    this.subscribeToPersistentSubscriptions(
      persistentSubscriptions as ESPersistentSubscription[],
    );

  }

  async subscribeToPersistentSubscriptions(
    subscriptions: ESPersistentSubscription[],
  ) {
    this.persistentSubscriptionsCount = subscriptions.length;
    this.persistentSubscriptions = await Promise.all(
      subscriptions.map(async subscription => {
        return await this.subscribeToPersistentSubscription(
          subscription.stream,
          subscription.group,
          subscription.autoAck,
          subscription.bufferSize,
          subscription.onSubscriptionDropped,
          // TODO add auto ack, concurrency and other options
          // TODO add on drop handler to see what to do
        );
      }),
    );
  }

  subscribeToCatchUpSubscriptions(subscriptions: ESCatchUpSubscription[]) {
    this.catchupSubscriptionsCount = subscriptions.length;
    this.catchupSubscriptions = subscriptions.map(subscription => {
      return this.subscribeToCatchupSubscription(subscription.stream);
    });
  }

  get allCatchUpSubscriptionsLive(): boolean {
    const initialized =
      this.catchupSubscriptions.length === this.catchupSubscriptionsCount;
    return (
      initialized &&
      this.catchupSubscriptions.every(subscription => {
        return !!subscription && subscription.isLive;
      })
    );
  }

  get allPersistentSubscriptionsLive(): boolean {
    const initialized =
      this.persistentSubscriptions.length === this.persistentSubscriptionsCount;
    return (
      initialized &&
      this.persistentSubscriptions.every(subscription => {
        return !!subscription && subscription.isLive;
      })
    );
  }

  get isLive(): boolean {
    return (
      this.allCatchUpSubscriptionsLive && this.allPersistentSubscriptionsLive
    );
  }

  async publish(event: IEvent, stream?: string) {
    const payload: EventData = createEventData(
      v4(),
      event.constructor.name,
      true,
      Buffer.from(JSON.stringify(event)),
    );

    try {
      await this.eventStore.connection.appendToStream(stream, -2, [payload]);
    } catch (err) {
      this.logger.error(err);
    }
  }

  subscribeToCatchupSubscription(stream: string): ExtendedCatchUpSubscription {
    this.logger.log(`Catching up and subscribing to stream ${stream}!`);
    try {
      return this.eventStore.connection.subscribeToStreamFrom(
        stream,
        0,
        true,
        (sub, payload) => this.onEvent(sub, payload),
        subscription =>
          this.onLiveProcessingStarted(
            subscription as ExtendedCatchUpSubscription,
          ),
        (sub, reason, error) =>
          this.onDropped(sub as ExtendedCatchUpSubscription, reason, error),
      ) as ExtendedCatchUpSubscription;
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async subscribeToPersistentSubscription(
    stream: string,
    subscriptionName: string,
    autoAck: boolean = false,
    bufferSize: number = 10,
    onSubscriptionDropped: (sub, reason, error) => void,
  ): Promise<ExtendedPersistentSubscription> {
    try {
      this.logger.log(`
      Connecting to persistent subscription ${subscriptionName} on stream ${stream}!
      `);
      const resolved = (await this.eventStore.connection.connectToPersistentSubscription(
        stream,
        subscriptionName,
        (sub, payload) => {
          this.onEvent(sub, payload);
        },
        (sub, reason, error) => {
          this.onDropped(sub as ExtendedPersistentSubscription, reason, error);
          if (onSubscriptionDropped) {
            onSubscriptionDropped(sub, reason, error);
          }
        },
        undefined,
        bufferSize,
        autoAck,
      )) as ExtendedPersistentSubscription;

      resolved.isLive = true;

      return resolved;
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async onEvent(_subscription, payload) {
    const { event } = payload;

    if (/*!payload.isResolved ||*/ !event || !event.isJson) {
      this.logger.error('Received event that could not be resolved! acknowledge');
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }

    // TODO use a factory to avoid manual declaration ?
    const eventConstructor = this.eventConstructors[event.eventType];
    if (!eventConstructor) {
      this.logger.warn(`Received event of type ${event.eventType} that has no handler acknowledge`);
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }
    //console.log('onevent',event);
    let data = {};
    try {
      data = JSON.parse(event.data.toString());
    } catch (e) {
      this.logger.warn(`Received event of type ${event.eventType} with shitty data acknowledge`);
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }

    let metadata = {};
    if (event.metadata.toString()) {
      metadata = JSON.parse(event.metadata.toString());
    }
    if (Object.keys(metadata).length == 0) {
      this.logger.warn(`Received event of type ${event.eventType} with no metadata acknowledge`);
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }

    const builtEvent = eventConstructor(
      data,
      metadata,
      event.eventId,
      event.eventStreamId,
      event.eventNumber.low,
      new Date(event.created),
      event.eventType,
    );

    if (builtEvent instanceof AcknowledgableEventstoreEvent) {
      builtEvent.setSubscription(_subscription);
    }
    this.subject$.next(builtEvent);
  }

  onDropped(
    subscription: ExtendedPersistentSubscription | ExtendedCatchUpSubscription,
    _reason: string,
    error: Error,
  ) {
    subscription.isLive = false;
    this.logger.error(error);
  }

  onLiveProcessingStarted(subscription: ExtendedCatchUpSubscription) {
    subscription.isLive = true;
    this.logger.log('Live processing of EventStore events started!');
  }

  addEventHandlers(eventHandlers: IEventConstructors) {
    this.eventConstructors = {
      ...this.eventConstructors,
      ...eventHandlers,
    };
  }
}
