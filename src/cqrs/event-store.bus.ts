import {
  EventBus,
  IEvent,
  IEventPublisher,
  IMessageSource,
} from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventStore } from '../event-store.class';
import {
  EventStoreCatchupSubscriptionConfig,
  EventStoreEvent,
  EventStoreVolatileSubscriptionConfig,
  ExpectedVersion,
  IEventStoreBusConfig,
  IEventStoreEventOptions,
  IEventStorePersistentSubscriptionConfig,
  IEventStoreProjection,
  IStreamConfig,
} from '../';
import { IAcknowledgeableEvent } from '..';
import { tap } from 'rxjs/operators';

const fs = require('fs');

@Injectable()
export class EventStoreBus
  implements IEventPublisher, OnModuleDestroy, OnModuleInit, IMessageSource {
  private readonly eventMapper: (data, options: IEventStoreEventOptions) => {};
  private logger = new Logger('EventStoreBus');

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
  async onModuleInit() {
    this.logger.debug(`Replace EventBus publisher by Eventstore publish`);
    // FIXME typescript voodoo
    this.subject$ = (this.eventBus as any).subject$;
    this.bridgeEventsTo((this.eventBus as any).subject$);
    this.eventBus.publish = this.publish;

    return await this.connect();
  }

  async connect() {
    // Nothing to connect to, don't connect
    await this.eventStore.connect();
    await this.assertProjections(this.config.projections || []);
    if (this.config.subscriptions) {
      await this.subscribeToCatchUpSubscriptions(
        this.config.subscriptions.catchup || [],
      );
      await this.subscribeToVolatileSubscriptions(
        this.config.subscriptions.volatile || [],
      );
      await this.subscribeToPersistentSubscriptions(
        this.config.subscriptions.persistent || [],
      );
      this.logger.debug(`Eventstore connected`);
    }
    return Promise.resolve(this);
  }

  onModuleDestroy(): any {
    this.logger.log(`disconnect eventstore`);
    this.eventStore.close();
  }

  publish(event: IEvent) {
    const expectedVersion = event['expectedVersion'] || ExpectedVersion.Any;

    return this.eventStore
      .writeEvents(event['eventStreamId'], [event], expectedVersion)
      .pipe(
        tap(_ => {
          // Forward to local event handler and saga
          if (this.config.publishAlsoLocally) {
            this.subject$.next(event);
          }
        }),
      )
      .toPromise();
  }

  async publishAll(events: IEvent[], streamConfig: IStreamConfig) {
    const expectedVersion = streamConfig.expectedVersion || ExpectedVersion.Any;
    const eventCount = events.length;
    this.logger.debug(
      `Commit ${eventCount} events to stream ${streamConfig.streamName} with expectedVersion ${streamConfig.expectedVersion}`,
    );
    return this.eventStore
      .writeEvents(streamConfig.streamName, events, expectedVersion)
      .pipe(
        tap(_ => {
          // Forward to local event handler and saga
          if (this.config.publishAlsoLocally) {
            events.forEach(this.subject$.next);
          }
        }),
      )
      .toPromise();
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

  async subscribeToCatchUpSubscriptions(
    subscriptions: EventStoreCatchupSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map((config: EventStoreCatchupSubscriptionConfig) => {
        return this.eventStore.subscribeToCatchupSubscription(
          config.stream,
          this.onEvent,
          config.lastCheckpoint,
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async subscribeToVolatileSubscriptions(
    subscriptions: EventStoreVolatileSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map((config: EventStoreVolatileSubscriptionConfig) => {
        return this.eventStore.subscribeToVolatileSubscription(
          config.stream,
          this.onEvent,
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
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
          if (!e.response || e.response.status != 404) {
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
    await Promise.all(
      subscriptions.map(async config => {
        this.logger.log(
          `Connecting to persistent subscription "${config.group}" on stream ${config.stream}`,
        );
        return await this.eventStore.subscribeToPersistentSubscription(
          config.stream,
          config.group,
          this.onEvent,
          config.autoAck,
          config.bufferSize,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async onEvent(subscription, payload) {
    const { event } = payload;

    // TODO allow unresolved event
    if (!payload.isResolved) {
      this.logger.warn(
        `Ignore unresolved event from stream ${payload.originalStreamId} with ID ${payload.originalEvent.eventId}`,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        await subscription.acknowledge([payload]);
      }
      return;
    }
    // TODO handle not JSON
    if (!event.isJson) {
      // TODO add info on error not coded
      this.logger.warn(
        `Received event that could not be resolved! stream ${event.eventStreamId} type ${event.eventType} id ${event.eventId} `,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        await subscription.acknowledge([payload]);
      }
      return;
    }

    // TODO throw error
    let data = {};
    try {
      data = JSON.parse(event.data.toString());
    } catch (e) {
      this.logger.warn(
        `Received event of type ${event.eventType} with shitty data acknowledge`,
      );
      if (!subscription._autoAck && subscription.hasOwnProperty('_autoAck')) {
        await subscription.acknowledge([payload]);
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
        await subscription.acknowledge([payload]);
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
