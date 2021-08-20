import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ModuleRef } from '@nestjs/core';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import ESEvent from '../events/es-event';
import { v4 } from 'uuid';
import { jsonEvent, PersistentSubscription } from '@eventstore/db-client';
import { JSONEventData } from '@eventstore/db-client/dist/types';
import { Client } from '@eventstore/db-client/dist/Client';
import { ProjectionConfiguration } from '../es-subsystems/projection.configuration';
import EsSubsystemConfiguration from '../es-subsystems/es-subsystem.configuration';
import {
  EVENT_STORE_CONNECTOR,
  EVENT_STORE_SUBSYSTEMS,
} from '../constants/es-injectors.constant';
import { SubscriptionConfiguration } from '../es-subsystems/subscription.configuration';
import { ALREADY_EXIST_ERROR_CODE } from '../constants/es-errors.constant';

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

  private async init(): Promise<void> {
    await this.assertProjections();
    this.getPersistentSubscriptionsReferences();
    this.logger.debug('EventStoreBus initialized');
  }

  private getPersistentSubscriptionsReferences() {
    this.esConfig.subscriptions?.map(
      async (subscriptionConf: SubscriptionConfiguration) => {
        await this.assertPersistentSubscription(subscriptionConf);
      },
    );
  }

  private async assertPersistentSubscription(
    subscriptionConf: SubscriptionConfiguration,
  ): Promise<void> {
    let subscription: PersistentSubscription;
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
      subscription = this.eventStoreConnector.connectToPersistentSubscription(
        subscriptionConf.stream,
        subscriptionConf.group,
        { bufferSize: subscriptionConf.options.liveBufferSize },
      );
      subscription.on('data', (event) => {
        this.logger.debug(
          `Event on stream : ${subscriptionConf.stream} : ${event.event.type}`,
        );
      });
      this.persistentSubscriptions.push(subscription);
    }
  }

  private async assertProjections(): Promise<void> {
    this.esConfig.projections?.map(
      async (projection: ProjectionConfiguration) => {
        await projection.assert(this.eventStoreConnector);
      },
    );
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
