import { EventBus, IEvent, IEventPublisher, IMessageSource } from '@nestjs/cqrs';
import { from, Subject } from 'rxjs';
import {
  EventStoreCatchUpSubscription,
  EventStorePersistentSubscription,
  PersistentSubscriptionNakEventAction,
} from 'node-eventstore-client';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventStore } from '../event-store.class';
import { v4 } from 'uuid';
import {
  EventStoreCatchupSubscriptionConfig,
  EventStoreEvent,
  ExpectedVersion,
  IEventStoreBusConfig,
  IEventStoreEventOptions,
  IEventStorePersistentSubscriptionConfig,
  IEventStoreProjection,
  IStreamConfig,
} from '../';
import { IAcknowledgeableEvent } from '..';
import { map, toArray } from 'rxjs/operators';

const fs = require('fs');

@Injectable()
export class EventStoreBus implements IEventPublisher, OnModuleDestroy, OnModuleInit, IMessageSource {
  private readonly eventMapper: (
    data,
    options: IEventStoreEventOptions,
  ) => {};
  private logger = new Logger('EventStoreBus');
  private catchupSubscriptions: EventStoreCatchUpSubscription[] = [];
  private persistentSubscriptions: EventStorePersistentSubscription[] = [];

  constructor(
    private eventStore: EventStore,
    private subject$: Subject<IEvent>,
    private config: IEventStoreBusConfig,
    private eventBus: EventBus,
  ) {
    this.eventMapper = config.eventMapper;

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
    this.eventBus.publish = this.publish;
  }

  async connect() {
    // Nothing to connect to, don't connect
    await this.assertProjections(this.config.projections || []);
    if (this.config.subscriptions) {
      await this.eventStore.connect();
      await this.subscribeToCatchUpSubscriptions(this.config.subscriptions.catchup || []);
      await this.subscribeToPersistentSubscriptions(this.config.subscriptions.persistent || []);
      this.logger.debug(`Eventstore connected`);
    }
    return Promise.resolve(this);
  }

  onModuleDestroy(): any {
    this.logger.log(`disconnect eventstore`);
    this.eventStore.close();
  }

  addDefaultEventValue(event: IEvent): IEvent {
    return {
      id: event['eventId'] || v4(),
      type: event['eventType'] || event.constructor.name,
      data: event['data'] || {},
      metadata: event['metadata'] || {},
    } as IEvent;
  }

  async publish(event: IEvent) {
    const expectedVersion = event['expectedVersion'] || ExpectedVersion.Any;

    // FIXME how to handle errors here
    // TODO how to use observer
    try {
      await this.eventStore.writeEvents(event['eventStreamId'], [this.addDefaultEventValue(event)], expectedVersion).toPromise();
    } catch (err) {
      if (!err.response) {
        this.logger.error(`Error appending ${event.constructor.name} to stream ${event['eventStreamId']} : ${err.message}`);
      } else {
        this.logger.warn(`Error appending ${event.constructor.name} to stream ${event['eventStreamId']} : ${err.response.statusText} (code ${err.response.status})`);
      }
    }
  }

  async publishAll(events: IEvent[], streamConfig: IStreamConfig) {
    events = await from(events).pipe(map(this.addDefaultEventValue), toArray()).toPromise();
    const expectedVersion = streamConfig.expectedVersion || ExpectedVersion.Any;
    const eventCount = events.length;
    this.logger.debug(`Commit ${eventCount} events to stream ${streamConfig.streamName} with expectedVersion ${streamConfig.expectedVersion}`);
    // TODO HANDLE errors
    return await this.eventStore.writeEvents(streamConfig.streamName, events, expectedVersion).toPromise();
  }

  get subscriptions(): { persistent: EventStorePersistentSubscription[], catchup: EventStoreCatchUpSubscription[] } {
    return {
      persistent: this.persistentSubscriptions,
      catchup: this.catchupSubscriptions,
    };
  }

  async assertProjections(projections: IEventStoreProjection[]) {
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

  subscribeToCatchUpSubscriptions(
    subscriptions: EventStoreCatchupSubscriptionConfig[],
  ) {
    this.catchupSubscriptions = subscriptions.map((config: EventStoreCatchupSubscriptionConfig) => {
      return this.subscribeToCatchupSubscription(config.stream, config.onSubscriptionStart, config.onSubscriptionDropped);
    });
  }

  subscribeToCatchupSubscription(stream: string, onSubscriptionStart: (subscription) => void = undefined, onSubscriptionDropped: (sub, reason, error) => void = undefined): EventStoreCatchUpSubscription {
    this.logger.log(`Catching up and subscribing to stream ${stream}!`);
    try {
      return this.eventStore.connection.subscribeToStreamFrom(
        stream,
        0,
        true,
        (sub, payload) => this.onEvent(sub, payload),
        subscription => {
          this.catchupSubscriptions[stream] = subscription;
          if (onSubscriptionStart) {
            onSubscriptionStart(subscription);
          }
        },
        (subscription, reason, error) => {
          delete this.catchupSubscriptions[stream];
          if (onSubscriptionDropped) {
            onSubscriptionDropped(subscription, reason, error);
          }
        },
      ) as EventStoreCatchUpSubscription;
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async subscribeToPersistentSubscriptions(
    subscriptions: IEventStorePersistentSubscriptionConfig[],
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
    this.persistentSubscriptions = await Promise.all(
      subscriptions.map(async config => {
        this.logger.log(
          `Connecting to persistent subscription "${config.group}" on stream ${config.stream}`,
        );
        return await this.subscribeToPersistentSubscription(
          config.stream,
          config.group,
          config.autoAck,
          config.bufferSize,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async subscribeToPersistentSubscription(
    stream: string,
    group: string,
    autoAck: boolean = false,
    bufferSize: number = 10,
    onSubscriptionStart: (sub) => void = undefined,
    onSubscriptionDropped: (sub, reason, error) => void = undefined,
  ): Promise<EventStorePersistentSubscription> {
    try {
      return await this.eventStore.connection.connectToPersistentSubscription(
        stream,
        group,
        (sub, payload) => {
          this.onEvent(sub, payload);
        },
        (subscription, reason, error) => {
          delete this.persistentSubscriptions[`${stream}-${group}`];
          if (onSubscriptionDropped) {
            onSubscriptionDropped(subscription, reason, error);
          }
        },
        undefined,
        bufferSize,
        autoAck,
      ).then(subscription => {
        this.logger.log(
          `Connected to persistent subscription ${group} on stream ${stream}!`,
        );
        this.persistentSubscriptions[`${stream}-${group}`] = subscription;
        if (onSubscriptionStart) {
          onSubscriptionStart(subscription);
        }
        return subscription;
      });
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async onEvent(subscription, payload) {
    const { event } = payload;

    if (!payload.isResolved) {
      this.logger.warn(
        `Ignore unresolved event from stream ${payload.originalStreamId} with ID ${payload.originalEvent.eventId}`,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        subscription.acknowledge([payload]);
      }
      return;
    }
    // TODO handle not JSON
    if (!event.isJson) {
      this.logger.warn(
        `Received event that could not be resolved! stream ${event.eventStreamId} type ${event.eventType} id ${event.eventId} `,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        subscription.acknowledge([payload]);
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
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        subscription.acknowledge([payload]);
      }
      return;
    }

    let metadata = {};
    if (event.metadata.toString()) {
      metadata = JSON.parse(event.metadata.toString());
    }

    const finalEvent = this.eventMapper(data, {
      metadata,
      eventStreamId: event.eventStreamId,
      eventId: event.eventId,
      created: new Date(event.created),
      eventNumber: event.eventNumber.low,
      eventType: event.eventType,
      originalEventId: payload.originalEvent.eventId || event.eventId,
    }) as IAcknowledgeableEvent & EventStoreEvent;

    if (!finalEvent) {
      this.logger.warn(
        `Received event of type ${event.eventType} with no declared handler acknowledge`,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        subscription.acknowledge([payload]);
      }
      return;
    }
    // If event wants to handle ack/nack
    // only for persistent
    if (subscription.hasOwnProperty('_autoAck')) {
      if (
        typeof finalEvent.ack == 'function' &&
        typeof finalEvent.nack == 'function'
      ) {
        const ack = async () => {
          this.logger.debug(
            `Acknowledge event ${event.eventType} with id ${event.eventId}`,
          );
          return subscription.acknowledge([payload]);
        };
        const nack = async (
          action: PersistentSubscriptionNakEventAction,
          reason: string,
        ) => {
          this.logger.debug(
            `Fail for event ${event.eventType} with id ${event.eventId} for reason ${reason}`,
          );
          return subscription.fail([payload], action, reason);
        };

        finalEvent.ack = ack;
        finalEvent.nack = nack;
      } else {
        // Otherwise manage here
        this.logger.debug(
          `Auto acknowledge event ${event.eventType} with id ${event.eventId}`,
        );
        subscription.acknowledge([payload]);
      }
    }

    // Dispatch to event handlers and sagas
    this.subject$.next(finalEvent);
  }
}
