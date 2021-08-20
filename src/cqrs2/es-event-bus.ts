import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import ESEvent from './es-event';
import { v4 } from 'uuid';
import { jsonEvent, PersistentSubscription } from '@eventstore/db-client';
import { JSONEventData } from '@eventstore/db-client/dist/types';
import { Client } from '@eventstore/db-client/dist/Client';
import { ProjectionConfiguration } from './es-subsystems/projection.configuration';
import EsSubsystemConfiguration from './es-subsystems/es-subsystem.configuration';
import {
  ALREADY_EXIST_ERROR_CODE,
  EVENT_STORE_CONNECTOR,
  EVENT_STORE_SUBSYSTEMS,
} from './es.constant';
import { SubscriptionConfiguration } from './es-subsystems/subscription.configuration';

@Injectable()
export default class ESEventBus<EventType extends ESEvent = ESEvent>
  extends EventBus<ESEvent>
  implements OnModuleInit
{
  private readonly logger = new Logger(this.constructor.name);

  private persistentSubscriptions: PersistentSubscription[] = [];

  constructor(
    commandBus: CommandBus,
    moduleRef: ModuleRef,
    @Inject(EVENT_STORE_CONNECTOR)
    private readonly eventStoreConnector: Client,
    @Inject(EVENT_STORE_SUBSYSTEMS)
    private readonly esConfig: EsSubsystemConfiguration,
  ) {
    super(commandBus, moduleRef);
  }

  public async onModuleInit(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    Promise.all([
      this.esConfig.projections.map((projection: ProjectionConfiguration) => {
        projection.assert(this.eventStoreConnector);
      }),
      this.esConfig.subscriptions.map(
        async (subscriptionConf: SubscriptionConfiguration) => {
          let subscription: PersistentSubscription = null;
          try {
            await this.eventStoreConnector.createPersistentSubscription(
              subscriptionConf.stream,
              subscriptionConf.group,
              subscriptionConf.options,
            );
          } catch (e) {
            if (e.code !== ALREADY_EXIST_ERROR_CODE) {
              this.logger.error(
                `trying to create subscription : ${subscriptionConf.stream} with group ${subscriptionConf.group}`,
                e,
              );
            }
          } finally {
            subscription =
              this.eventStoreConnector.connectToPersistentSubscription(
                subscriptionConf.stream,
                subscriptionConf.group,
                { bufferSize: subscriptionConf.bufferSize },
              );
            subscription.on('data', (event) => {
              this.logger.debug(
                `Event on stream : ${subscriptionConf.stream} : ${event.event.type}`,
              );
            });
            this.persistentSubscriptions.push(subscription);
          }
        },
      ),
    ]).then(() => this.logger.debug('EventStoreBus initialized'));
  }

  public getPersistentSubscriptions(): PersistentSubscription[] {
    return this.persistentSubscriptions;
  }

  public async publish<EventType extends ESEvent>(
    event: EventType,
  ): Promise<void> {
    const formattedEvent: JSONEventData = jsonEvent({
      data: {
        event: event,
      },
      type: event.constructor.name,
      id: v4(),
    });

    this.logger.debug(`formattedEvent : ${JSON.stringify(formattedEvent)}`);

    await this.eventStoreConnector.appendToStream(
      event.context.streamName ?? 'no-stream',
      [formattedEvent],
    );
    return super.publish(event);
  }
}
