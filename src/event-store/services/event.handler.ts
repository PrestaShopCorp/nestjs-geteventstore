import { IAcknowledgeableEvent } from '../../interfaces';
import { PersistentSubscriptionNakEventAction } from 'node-eventstore-client';
import { Logger, Optional } from '@nestjs/common';
import { ReadEventBus } from '../../cqrs';
import { IEventHandler } from './event.handler.interface';

export default class EventHandler implements IEventHandler {
  private logger: Logger = new Logger(this.constructor.name);

  constructor(@Optional() private readonly eventBus?: ReadEventBus) {}

  public async onEvent(subscription: any, payload: any): Promise<any> {
    // do nothing, as we have not defined an event bus
    if (!this.eventBus) {
      return;
    }

    // use default onEvent
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
