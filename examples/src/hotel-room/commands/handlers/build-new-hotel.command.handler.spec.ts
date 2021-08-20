import { BuildNewHotelCommandHandler } from './build-new-hotel.command.handler';
import { BuildNewHotelCommand } from '../impl/build-new-hotel.command';
import { HotelBuiltEvent } from '../../events/impl/hotel-built.event';
import { HOTEL_STREAM_NAME } from '../../hotel-stream.constants';
import CommandResponse from '../response/command.response';
import spyOn = jest.spyOn;

describe('BuildNewHotelCommandHandler', () => {
  let commandHandler: BuildNewHotelCommandHandler;

  const esEventBusMock: any = {
    publish: jest.fn(),
  };
  const nbRooms = 3;
  const command: BuildNewHotelCommand = new BuildNewHotelCommand(nbRooms);
  let commandResponse: CommandResponse;

  beforeEach(async () => {
    jest.resetAllMocks();

    spyOn(esEventBusMock, 'publish');
    commandHandler = new BuildNewHotelCommandHandler(esEventBusMock);
    commandResponse = await commandHandler.execute(command);
  });

  it('should publish hotel built event when running this command', () => {
    const builtEvent: HotelBuiltEvent = new HotelBuiltEvent(
      {
        streamName: HOTEL_STREAM_NAME,
      },
      nbRooms,
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
