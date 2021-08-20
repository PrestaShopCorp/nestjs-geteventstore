import ESEventBus from './es-event-bus';
import ESEvent from '../events/es-event';
import EsSubsystemConfiguration from '../es-subsystems/es-subsystem.configuration';
import { ProjectionOnetimeConfiguration } from '../es-subsystems/projection.onetime.configuration';
import { SubscriptionConfiguration } from '../es-subsystems/subscription.configuration';
import {
  PersistentSubscription,
  persistentSubscriptionSettingsFromDefaults,
} from '@eventstore/db-client';
import { ALREADY_EXIST_ERROR_CODE } from '../constants/es-errors.constant';
import { ESContext } from '../events/es-context';
import { JSONEventData } from '@eventstore/db-client/dist/types';
import { EventBus } from '@nestjs/cqrs';
import spyOn = jest.spyOn;

describe('ESEventBus', () => {
  let eventbus: ESEventBus;

  const commandBusMock: any = jest.fn();
  const moduleRefMock: any = jest.fn();
  const clientMock: any = {
    createPersistentSubscription: jest.fn(),
    connectToPersistentSubscription: jest.fn(),
    appendToStream: jest.fn(),
  };
  let esConfig: EsSubsystemConfiguration = {};

  beforeEach(async () => {
    jest.resetAllMocks();
    eventbus = new ESEventBus<ESEvent>(
      commandBusMock,
      moduleRefMock,
      clientMock,
      esConfig,
    );
  });

  it('should be created', () => {
    expect(eventbus).toBeTruthy();
  });

  it('should assert projections given at module init', async () => {
    const projection1: ProjectionOnetimeConfiguration =
      new ProjectionOnetimeConfiguration('toto');
    const projection2: ProjectionOnetimeConfiguration =
      new ProjectionOnetimeConfiguration('tutu');

    spyOn(projection1, 'assert');
    spyOn(projection2, 'assert');

    esConfig = {
      projections: [projection1, projection2],
    };

    eventbus = new ESEventBus<ESEvent>(
      commandBusMock,
      moduleRefMock,
      clientMock,
      esConfig,
    );

    await eventbus.onModuleInit();

    expect(projection1.assert).toHaveBeenCalledWith(clientMock);
    expect(projection2.assert).toHaveBeenCalledWith(clientMock);
  });

  it('should try to create subscriptions given at module init', async () => {
    spyOn(clientMock, 'createPersistentSubscription');

    esConfig = {
      subscriptions: getDumbSubscriptionConfigurations(),
    };
    eventbus = new ESEventBus<ESEvent>(
      commandBusMock,
      moduleRefMock,
      clientMock,
      esConfig,
    );

    await eventbus.onModuleInit();

    expect(clientMock.createPersistentSubscription).toHaveBeenCalledTimes(2);
    expect(clientMock.createPersistentSubscription).toHaveBeenCalledWith(
      esConfig.subscriptions[0].stream,
      esConfig.subscriptions[0].group,
      esConfig.subscriptions[0].options,
    );
    expect(clientMock.createPersistentSubscription).toHaveBeenCalledWith(
      esConfig.subscriptions[0].stream,
      esConfig.subscriptions[0].group,
      esConfig.subscriptions[0].options,
    );
  });

  [false, true].forEach((subscriptionAlreadyExisted: boolean) => {
    it('should try to connect subscriptions given at module init when it already exists or not', async () => {
      spyOn(clientMock, 'connectToPersistentSubscription');
      spyOn(clientMock, 'createPersistentSubscription').mockImplementationOnce(
        () => {
          if (subscriptionAlreadyExisted)
            throw { code: ALREADY_EXIST_ERROR_CODE };
        },
      );

      esConfig = {
        subscriptions: getDumbSubscriptionConfigurations(),
      };
      eventbus = new ESEventBus<ESEvent>(
        commandBusMock,
        moduleRefMock,
        clientMock,
        esConfig,
      );

      await eventbus.onModuleInit();

      expect(clientMock.connectToPersistentSubscription).toHaveBeenCalledTimes(
        2,
      );
      expect(clientMock.connectToPersistentSubscription).toHaveBeenCalledWith(
        esConfig.subscriptions[0].stream,
        esConfig.subscriptions[0].group,
        { bufferSize: esConfig.subscriptions[0].options.liveBufferSize },
      );
      expect(clientMock.connectToPersistentSubscription).toHaveBeenCalledWith(
        esConfig.subscriptions[1].stream,
        esConfig.subscriptions[1].group,
        { bufferSize: esConfig.subscriptions[1].options.liveBufferSize },
      );
    });
  });

  it('should be able to return subscriptions when init complete', async () => {
    spyOn(clientMock, 'connectToPersistentSubscription').mockReturnValue({
      on: () => jest.fn(),
    });

    esConfig = {
      subscriptions: getDumbSubscriptionConfigurations(),
    };
    eventbus = new ESEventBus<ESEvent>(
      commandBusMock,
      moduleRefMock,
      clientMock,
      esConfig,
    );

    await eventbus.onModuleInit();
    const subscriptions: PersistentSubscription[] =
      eventbus.getPersistentSubscriptions();

    expect(subscriptions.length).toEqual(2);
    expect(subscriptions[0]).toBeTruthy();
    expect(subscriptions[1]).toBeTruthy();
  });

  it('should publish on event store when publishing an event', async () => {
    spyOn(clientMock, 'appendToStream');

    const event: DumbEvent = new DumbEvent();
    await eventbus.publish(event);

    const streamName = clientMock.appendToStream.mock.calls[0][0];
    const publishedEvents: JSONEventData[] =
      clientMock.appendToStream.mock.calls[0][1];

    expect(streamName).toEqual(event.context.streamName);
    expect(publishedEvents[0].data['event']).toEqual(event);
    expect(publishedEvents[0].type).toEqual(DumbEvent.name);
  });

  it('should publish as standard event bus when publishing', async () => {
    spyOn(eventbus as EventBus, 'publish');

    const event: DumbEvent = new DumbEvent();
    await eventbus.publish(event);

    expect((eventbus as EventBus).publish).toHaveBeenCalledWith(event);
  });
});

export const getDumbSubscriptionConfigurations =
  (): SubscriptionConfiguration[] => [
    {
      options: persistentSubscriptionSettingsFromDefaults({
        fromRevision: 'start',
      }),
      stream: 'toto1',
      group: 'tutu1',
    },
    {
      options: persistentSubscriptionSettingsFromDefaults({
        fromRevision: 'end',
      }),
      stream: 'toto2',
      group: 'tutu2',
    },
  ];

class DumbEvent implements ESEvent {
  public context: ESContext = {
    streamName: 'tutu',
  };
  public clientId = 'toto';
}
