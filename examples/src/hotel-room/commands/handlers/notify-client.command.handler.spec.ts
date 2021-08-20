import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';
import CommandResponse from '../response/command.response';
import { NotifyClientCommandHandler } from './notify-client.command.handler';
import { NotifyClientCommand } from '../impl/notify-client.command';
import { ClientNotifiedEvent } from '../../events/impl/client-notified.event';
import spyOn = jest.spyOn;

describe('NotifyClientCommandHandler', () => {
  let commandHandler: NotifyClientCommandHandler;

  const esEventBusMock: any = {
    publish: jest.fn(),
  };
  const clientId = 'toto';
  const dateCheckout = new Date();
  const dateArrival = new Date();
  const command: NotifyClientCommand = new NotifyClientCommand(
    clientId,
    dateArrival,
    dateCheckout,
  );
  let commandResponse: CommandResponse;

  beforeEach(async () => {
    jest.resetAllMocks();

    spyOn(esEventBusMock, 'publish');
    commandHandler = new NotifyClientCommandHandler(esEventBusMock);
    commandResponse = await commandHandler.execute(command);
  });

  it('should publish notified client event when running this command', () => {
    const clientNotifiedEvent: ClientNotifiedEvent = new ClientNotifiedEvent(
      {
        streamName: HOTEL_STREAM_NAME,
      },
      clientId,
      dateArrival,
      dateCheckout,
    );
    expect(esEventBusMock.publish).toHaveBeenCalledWith(clientNotifiedEvent);
  });

  it('should return success command response when no error', () => {
    expect(commandResponse.result).toEqual('success');
  });

  it('should return fail command response while throwing an error', async () => {
    spyOn(esEventBusMock, 'publish').mockImplementation(() => {
      throw 'nope';
    });

    commandResponse = await commandHandler.execute(command);

    expect(commandResponse.result).toEqual('fail');
    expect(commandResponse.errorMsg).toEqual('nope');
  });
});
