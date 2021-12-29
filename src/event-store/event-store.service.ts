import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PersistentSubscriptionOptions } from 'geteventstore-promise';
import { readFileSync } from 'fs';

import { EventStoreProjectionType } from '../interfaces';
import { EventStore } from './event-store';
import { ReadEventBus } from '../cqrs';
import {
  IAcknowledgeableEvent,
  ICatchupSubscriptionConfig,
  IEventStoreServiceConfig,
  IPersistentSubscriptionConfig,
  IVolatileSubscriptionConfig,
} from '../interfaces';
import { EVENT_STORE_SERVICE_CONFIG } from '../constants';

@Injectable()
export class EventStoreService implements OnModuleDestroy, OnModuleInit {
  private logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly eventStore: EventStore,
    @Inject(EVENT_STORE_SERVICE_CONFIG)
    private readonly config: IEventStoreServiceConfig,
    @Optional() private readonly eventBus?: ReadEventBus,
  ) {}

  async onModuleInit() {
    return await this.connect();
  }

  async connect() {
    await this.eventStore.connect();
    this.logger.debug(`EventStore connected`);

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
    }
    // Wait for everything to be up before application boot
    return Promise.resolve(this);
  }

  onModuleDestroy(): any {
    this.logger.log(`Destroy, disconnect EventStore`);
    this.eventStore.close();
  }

  async assertProjections(projections: EventStoreProjectionType[]) {
    await Promise.all(
      projections.map(async (projection) => {
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
          content = readFileSync(projection.file, 'utf8');
        }
        await this.eventStore.HTTPClient.projections.assert(
          projection.name,
          content,
          projection.mode,
          projection.enabled,
          projection.checkPointsEnabled,
          projection.emitEnabled,
          projection.trackEmittedStreams,
        );
        this.logger.log(`Projection "${projection.name}" asserted !`);
      }),
    );
  }

  async subscribeToCatchUpSubscriptions(
    subscriptions: ICatchupSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map((config: ICatchupSubscriptionConfig) => {
        return this.eventStore.subscribeToCatchupSubscription(
          config.stream,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.lastCheckpoint,
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async subscribeToVolatileSubscriptions(
    subscriptions: IVolatileSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map((config: IVolatileSubscriptionConfig) => {
        return this.eventStore.subscribeToVolatileSubscription(
          config.stream,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.resolveLinkTos,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async subscribeToPersistentSubscriptions(
    subscriptions: IPersistentSubscriptionConfig[],
  ) {
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          this.logger.log(
            `Check if persistent subscription "${subscription.group}" on stream ${subscription.stream} needs to be created `,
          );
          if (subscription.options.resolveLinktos !== undefined) {
            this.logger.warn(
              "DEPRECATED: The resolveLinktos parameter shouln't be used anymore. The resolveLinkTos parameter should be used instead.",
            );
          }
          await this.eventStore.HTTPClient.persistentSubscriptions.getSubscriptionInfo(
            subscription.group,
            subscription.stream,
          );
        } catch (e) {
          if (!e.response || e.response.status != 404) {
            throw e;
          }
          const options: PersistentSubscriptionOptions = {
            ...subscription.options,
            ...{
              resolveLinkTos:
                subscription.options.resolveLinkTos ||
                subscription.options.resolveLinktos,
            },
          };
          await this.eventStore.HTTPClient.persistentSubscriptions.assert(
            subscription.group,
            subscription.stream,
            options,
          );
          this.logger.log(
            `Persistent subscription "${subscription.group}" on stream ${subscription.stream} created ! ` +
              JSON.stringify(subscription.options),
          );
        }
      }),
    );
    await Promise.all(
      subscriptions.map(async (config) => {
        this.logger.log(
          `Connecting to persistent subscription "${config.group}" on stream ${config.stream}`,
        );
        return await this.eventStore.subscribeToPersistentSubscription(
          config.stream,
          config.group,
          (subscription, payload) => this.onEvent(subscription, payload),
          config.autoAck,
          config.bufferSize,
          config.onSubscriptionStart,
          config.onSubscriptionDropped,
        );
      }),
    );
  }

  async onEvent(subscription, payload) {
    // use configured onEvent
    if (this.config.onEvent) {
      return this.config.onEvent(subscription, payload);
    }
    // do nothing, as we have not defined an event bus
    if (!this.eventBus) {
      return;
    }
    // use default onEvent
    const { event } = payload;
    // TODO allow unresolved event
    if (!payload.isResolved) {
      this.logger.warn(
        `Ignore unresolved event from stream ${payload.originalStreamId}[${event.eventNumber.low}] with ID ${payload.originalEvent.eventId}`,
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

    // we do not add default metadata as
    // we do not want to modify
    // read models
    let metadata = {};
    if (event.metadata.toString()) {
      metadata = { ...metadata, ...JSON.parse(event.metadata.toString()) };
    }

    const finalEvent = this.eventBus.map<IAcknowledgeableEvent>(data, {
      metadata,
      eventStreamId: event.eventStreamId,
      eventId: event.eventId,
      eventNumber: event.eventNumber.low,
      eventType: event.eventType,
      originalEventId: payload.originalEvent.eventId || event.eventId,
    });

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
            `Nak and ${
              Object.keys(PersistentSubscriptionNakEventAction)[action]
            } for event ${event.eventType} with id ${
              event.eventId
            } : reason ${reason}`,
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
    await this.eventBus.publish(finalEvent);
  }
}
