import { EventBus, IEvent, IEventPublisher, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventStore } from '../event-store.class';
import { v4 } from 'uuid';
import {
  EventStoreBusConfig,
  EventStoreCatchupSubscriptionConfig,
  EventStorePersistentSubscriptionConfig,
  EventStoreProjection,
  ExpectedVersion,
  TAcknowledgeEventStoreEvent,
  TEventStoreEvent,
} from '../..';
import { ExtendedCatchUpSubscription, ExtendedPersistentSubscription } from '../interfaces/EventStoreLibExtension';
import { IAcknowledgeableAggregateEvent } from '../interfaces/aggregate-event.interface';

const fs = require('fs');

@Injectable()
export class EventStoreBus implements IEventPublisher, OnModuleDestroy, OnModuleInit, IMessageSource {
  private readonly eventMapper: (
    event: TEventStoreEvent | TAcknowledgeEventStoreEvent,
  ) => {};
  private logger = new Logger('EventStoreBus');
  private catchupSubscriptions: ExtendedCatchUpSubscription[] = [];
  private catchupSubscriptionsCount: number;
  private persistentSubscriptions: ExtendedPersistentSubscription[] = [];
  private persistentSubscriptionsCount: number;

  constructor(
    private eventStore: EventStore,
    private subject$: Subject<IEvent>,
    config: EventStoreBusConfig,
    private eventBus: EventBus,
  ) {
    this.eventMapper = config.eventMapper;
    if (config.subscriptions) {
      // Nothing to connect to, don't connect
      this.connect();
      this.assertProjections(config.projections || []);
      this.subscribeToCatchUpSubscriptions(config.subscriptions.catchup || []);
      this.subscribeToPersistentSubscriptions(
        config.subscriptions.persistent || [],
      );
    }
  }

  // @ts-ignore
  async bridgeEventsTo<T extends IEvent>(subject: Subject<T>) {
    this.subject$ = subject;
  }

  /**
   * Hack nest eventBus instance to override publisher
   */
  onModuleInit(): any {
    this.logger.debug(`Replace EventBus publisher by Eventstore publish`);
    // FIXME typescript voodoo
    this.subject$ = (this.eventBus as any).subject$;
    this.bridgeEventsTo((this.eventBus as any).subject$);
    this.eventBus.publisher = this;
  }

  async connect() {
    await this.eventStore.connect();
    this.logger.debug(`Eventstore connected`);
  }

  async assertProjections(projections: EventStoreProjection[]) {
    await Promise.all(
      projections.map(async projection => {
        let content;
        if (projection.content) {
          this.logger.log(
            `Assert projection "${projection.name}" from content`,
          );
          content = projection.content;
        } else if (projection.file) {
          this.logger.log(
            `Assert projection "${projection.name}" from file ${projection.file}`,
          );
          content = fs.readFileSync(projection.file, 'utf8');
        }
        await this.eventStore.HTTPClient.projections.assert(
          projection.name,
          content,
          projection.mode,
          projection.enabled,
          projection.checkPointsEnabled,
          projection.emitEnabled,
        );
        this.logger.log(`Projection "${projection.name}" asserted !`);
      }),
    );
  }

  onModuleDestroy(): any {
    this.logger.log(`disconnect eventstore`);
    this.eventStore.close();
  }

  async subscribeToPersistentSubscriptions(
    subscriptions: EventStorePersistentSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map(async subscription => {
        try {
          this.logger.log(
            `Check if persistent subscription "${subscription.group}" on stream ${subscription.stream} needs to be created `,
          );
          await this.eventStore.HTTPClient.persistentSubscriptions.getSubscriptionInfo(
            subscription.group,
            subscription.stream,
          );
        } catch (e) {
          // FIXME see why status not exists
          if (e.response.status != 404) {
            throw e;
          }
          await this.eventStore.HTTPClient.persistentSubscriptions.assert(
            subscription.group,
            subscription.stream,
            subscription.options,
          );
          this.logger.log(
            `Persistent subscription "${subscription.group}" on stream ${subscription.stream} created ! ` +
            JSON.stringify(subscription.options),
          );
        }
      }),
    );
    this.persistentSubscriptionsCount = subscriptions.length;
    this.persistentSubscriptions = await Promise.all(
      subscriptions.map(async subscription => {
        this.logger.log(
          `Connecting to persistent subscription "${subscription.group}" on stream ${subscription.stream}`,
        );
        return await this.subscribeToPersistentSubscription(
          subscription.stream,
          subscription.group,
          subscription.autoAck,
          subscription.bufferSize,
          subscription.onSubscriptionDropped,
        );
      }),
    );
  }

  subscribeToCatchUpSubscriptions(
    subscriptions: EventStoreCatchupSubscriptionConfig[],
  ) {
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

  async publish(event: IEvent) {
    const payload = {
      id: event['id'] || v4(),
      type: event['type'] || event.constructor.name,
      data: event['data'] || {},
      metadata: event['metadata'] || {}
    }
    const expectedVersion = event['expectedVersion'] || ExpectedVersion.Any;

    // FIXME how to handle errors here
    // TODO how to use observer
    try {
      await this.eventStore.writeEvents(event['streamName'], [payload], expectedVersion).toPromise();
    } catch (err) {
      this.logger.error(`Error appending ${event.constructor.name} to stream ${event['streamName']} : ${err.response.statusText} (code ${err.response.status})`);
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
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ): Promise<ExtendedPersistentSubscription> {
    try {
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
      this.logger.log(
        `Connected to persistent subscription ${subscriptionName} on stream ${stream}!`,
      );
      return resolved;
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async onEvent(_subscription, payload) {
    const { event } = payload;

    if (/*!payload.isResolved ||*/ !event || !event.isJson) {
      this.logger.error(
        `Received event that could not be resolved! stream ${event.eventStreamId} type ${event.eventType} id ${event.eventId} acknowledge `,
      );
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }

    let data = {};
    try {
      data = JSON.parse(event.data.toString());
    } catch (e) {
      this.logger.warn(
        `Received event of type ${event.eventType} with shitty data acknowledge`,
      );
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }

    let metadata = {};
    if (event.metadata.toString()) {
      metadata = JSON.parse(event.metadata.toString());
    }
    // FIXME handle catchup that don't need ack/nack
    // TODO buffer one day ?
    const ack = async () => {
      this.logger.log(
        `Acknowledge event ${event.eventType} with id ${event.eventId}`,
      );
      return _subscription.acknowledge([payload]);
    };
    const nack = async (
      action: PersistentSubscriptionNakEventAction,
      reason: string,
    ) => {
      this.logger.log(
        `Fail for event ${event.eventType} with id ${event.eventId} for reason ${reason}`,
      );
      return _subscription.fail([payload], action, reason);
    };
    // FIXME use interface IAggregateEvent

    const finalEvent = this.eventMapper({
      data,
      metadata,
      eventStreamId: event.eventStreamId,
      eventId: event.eventId,
      created: new Date(event.created),
      eventNumber: event.eventNumber.low,
      eventType: event.eventType,
      originalEventId: payload.originalEvent.eventId || event.eventId,
    } as TAcknowledgeEventStoreEvent) as IAcknowledgeableAggregateEvent;

    if (!finalEvent) {
      this.logger.warn(
        `Received event of type ${event.eventType} with no declared handler acknowledge`,
      );
      if (!_subscription._autoAck) {
        _subscription.acknowledge([payload]);
      }
      return;
    }
    // If event wants to handle ack/nack
    // User made type check
    if(finalEvent.hasOwnProperty('ack') && finalEvent.hasOwnProperty('nack')) {
      finalEvent.ack = ack;
      finalEvent.nack = nack;
    }
    else {
      // Otherwise manage here
      this.logger.log(
        `Auto acknowledge event ${event.eventType} with id ${event.eventId}`,
      );
      _subscription.acknowledge([payload]);
    }
    this.subject$.next(finalEvent);
  }

  onLiveProcessingStarted(subscription: ExtendedCatchUpSubscription) {
    subscription.isLive = true;
    this.logger.log('Live processing of EventStore events started!');
  }

  onDropped(
    subscription: ExtendedPersistentSubscription | ExtendedCatchUpSubscription,
    _reason: string,
    error: Error,
  ) {
    subscription.isLive = false;
    this.logger.error(error);
  }

}
