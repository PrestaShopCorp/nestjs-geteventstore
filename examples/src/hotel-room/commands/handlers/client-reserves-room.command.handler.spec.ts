import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';
import CommandResponse from '../response/command.response';
import { ClientReservesRoomCommandHandler } from './client-reserves-room.command.handler';
import { ClientReservesRoomCommand } from '../impl/client-reserves-room.command';
import { ClientReservedRoomEvent } from '../../events/impl/client-reserved-room.event';
import Room from '../../domain/room';
import spyOn = jest.spyOn;

describe('ClientReservesRoomCommandHandler', () => {
  let commandHandler: ClientReservesRoomCommandHandler;

  const roomRegistryMock: any = {
    findRoomNumber: jest.fn(),
    registerClientHasKey: jest.fn(),
    reserveAvailableRoom: jest.fn(),
  };
  const clientNotifierMock: any = {
    sendConfirmation: jest.fn(),
  };
  const houseMaidMock: any = {};
  const esEventBusMock: any = {
    publish: jest.fn(),
  };
  const clientId = 'MrJeckill';
  const reservedRoomNumber = 1;
  const dateCheckout = new Date();
  const dateArrival = new Date();

  const command: ClientReservesRoomCommand = new ClientReservesRoomCommand(
    clientId,
    dateArrival,
    dateCheckout,
  );
  let commandResponse: CommandResponse;

  beforeEach(async () => {
    jest.resetAllMocks();

    spyOn(esEventBusMock, 'publish');
    spyOn(roomRegistryMock, 'findRoomNumber').mockReturnValue(
      reservedRoomNumber,
    );
    spyOn(roomRegistryMock, 'reserveAvailableRoom').mockReturnValue(
      new Room(reservedRoomNumber),
    );

    commandHandler = new ClientReservesRoomCommandHandler(
      roomRegistryMock,
      clientNotifierMock,
      houseMaidMock,
      esEventBusMock,
    );
    commandResponse = await commandHandler.execute(command);
  });

  it('should publish client reserved room event when running this command', () => {
    const clientArrivesEvent: ClientReservedRoomEvent =
      new ClientReservedRoomEvent(
        {
          streamName: HOTEL_STREAM_NAME,
        },
        clientId,
        reservedRoomNumber,
        dateArrival,
        dateCheckout,
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
