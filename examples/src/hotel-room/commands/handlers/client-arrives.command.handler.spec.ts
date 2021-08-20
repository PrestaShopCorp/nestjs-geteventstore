import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';
import CommandResponse from '../response/command.response';
import { ClientArrivesCommandHandler } from './client-arrives.command.handler';
import { ClientArrivesCommand } from '../impl/client-arrives.command';
import { ClientArrivedEvent } from '../../events/impl/client-arrived.event';
import spyOn = jest.spyOn;

describe('ClientArrivesCommandHandler', () => {
  let commandHandler: ClientArrivesCommandHandler;

  const roomRegistryMock: any = {
    findRoomNumber: jest.fn(),
    registerClientHasKey: jest.fn(),
  };
  const clientNotifierMock: any = {};
  const houseMaidMock: any = {};
  const esEventBusMock: any = {
    publish: jest.fn(),
  };
  const clientId = 'MrJeckill';
  const roomNumber = 2;

  const command: ClientArrivesCommand = new ClientArrivesCommand(clientId);
  let commandResponse: CommandResponse;

  beforeEach(async () => {
    jest.resetAllMocks();

    spyOn(esEventBusMock, 'publish');
    spyOn(roomRegistryMock, 'findRoomNumber').mockReturnValue(roomNumber);
    commandHandler = new ClientArrivesCommandHandler(
      roomRegistryMock,
      clientNotifierMock,
      houseMaidMock,
      esEventBusMock,
    );
    commandResponse = await commandHandler.execute(command);
  });

  it('should publish client arrived event when running this command', () => {
    const clientArrivesEvent: ClientArrivedEvent = new ClientArrivedEvent(
      {
        streamName: HOTEL_STREAM_NAME,
      },
      clientId,
      roomNumber,
    );
    expect(esEventBusMock.publish).toHaveBeenCalledWith(clientArrivesEvent);
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
