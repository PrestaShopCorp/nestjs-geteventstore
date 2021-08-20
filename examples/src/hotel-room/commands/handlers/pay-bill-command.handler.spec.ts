import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';
import CommandResponse from '../response/command.response';
import { PayBillCommandHandler } from './pay-bill-command.handler';
import { PayBillCommand } from '../impl/pay-bill.command';
import { ClientPaidEvent } from '../../events/impl/client-paid.event';
import spyOn = jest.spyOn;

describe('PayBillCommandHandler', () => {
  let commandHandler: PayBillCommandHandler;

  const roomRegistryMock: any = {
    findRoomNumber: jest.fn(),
    registerClientHasKey: jest.fn(),
    registerBillPaiement: jest.fn(),
  };
  const clientNotifierMock: any = {};
  const houseMaidMock: any = {};
  const esEventBusMock: any = {
    publish: jest.fn(),
  };
  const clientId = 'toto';
  const command: PayBillCommand = new PayBillCommand(clientId, 'allIsOk');
  let commandResponse: CommandResponse;

  beforeEach(async () => {
    jest.resetAllMocks();

    spyOn(esEventBusMock, 'publish');
    commandHandler = new PayBillCommandHandler(
      roomRegistryMock,
      clientNotifierMock,
      houseMaidMock,
      esEventBusMock,
    );
    commandResponse = await commandHandler.execute(command);
  });

  it('should publish client paid event when running this command', () => {
    const builtEvent: ClientPaidEvent = new ClientPaidEvent(
      {
        streamName: HOTEL_STREAM_NAME,
      },
      clientId,
      100,
    );
    expect(esEventBusMock.publish).toHaveBeenCalledWith(builtEvent);
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
