import Hotel from './hotel';
import { RoomRegistry } from './ports/room-registry';
import { ClientNotifier } from './ports/client-notifier';
import Room from './room';
import Client from './client';
import HouseMaid from './ports/house-maid';
import spyOn = jest.spyOn;

describe('Hotel use cases', () => {
  let hotel: Hotel;

  const clientId = 'id';
  const client: Client = new Client(clientId);

  const arrival: Date = new Date();
  const checkout: Date = new Date();

  const roomNumber = 101;
  const room: Room = new Room(roomNumber);

  const housemaidMock: HouseMaid = {
    cleansTheRoom(roomNumber: number): void {},
    async checksOutRoom(
      roomNumber: number,
    ): Promise<'allIsOk' | 'towelsMissing'> {
      return 'allIsOk';
    },
  };
  const roomRegistryMock: RoomRegistry = {
    async registerClientHasKey(clientId: string): Promise<void> {},
    registerBillPaiement(clientId: string, billAmount: number): void {},
    async findRoomNumber(clientId: string): Promise<number> {
      return 101;
    },
    releaseRoom(roomNumber: number): Promise<void> {
      return Promise.resolve();
    },
    async reserveAvailableRoom(): Promise<Room | null> {
      return room;
    },
  };
  const clientNotifier: ClientNotifier = {
    sendConfirmation(clientId: string): Promise<void> {
      return Promise.resolve();
    },
  };

  beforeEach(() => {
    hotel = new Hotel(roomRegistryMock, clientNotifier, housemaidMock);
  });

  describe('when client reserve a room', () => {
    it('should refuse to provide no room is available', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom').mockImplementationOnce(
        async (): Promise<null> => {
          return null;
        },
      );

      const needToCheckAnotherHotel: Room = await hotel.reserveRoom(
        clientId,
        arrival,
        checkout,
      );

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalled();
      expect(needToCheckAnotherHotel).toBeFalsy();
    });

    it('should send a confirmation when a room is reserved', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom').mockImplementationOnce(
        async (): Promise<Room> => {
          return new Room(101);
        },
      );
      spyOn(clientNotifier, 'sendConfirmation');

      await hotel.reserveRoom(clientId, arrival, checkout);

      expect(clientNotifier.sendConfirmation).toHaveBeenCalled();
    });

    it('should get available room identifier when reserving and hotel is not full', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom');

      const availableRoom: Room = await hotel.reserveRoom(
        clientId,
        arrival,
        checkout,
      );

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalled();
      expect(availableRoom.getNumber()).toBeTruthy();
    });

    it('should associate a reserved room with client id, arrival and checkout dates when room is available', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom');

      await hotel.reserveRoom(clientId, arrival, checkout);

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalledWith(
        client.getId(),
        arrival,
        checkout,
      );
    });
  });

  describe('when client arrives at the hotel', () => {
    it('should find the room reserved by the client', async () => {
      spyOn(roomRegistryMock, 'findRoomNumber').mockResolvedValueOnce(101);

      await hotel.findKey(clientId);

      expect(roomRegistryMock.findRoomNumber).toHaveBeenCalled();
    });

    it('should give the client the room key when she arrives', async () => {
      spyOn(roomRegistryMock, 'registerClientHasKey');

      const roomNumber = await hotel.givesKeyToClient(clientId);

      expect(roomRegistryMock.registerClientHasKey).toHaveBeenCalledWith(
        clientId,
      );
      expect(roomNumber).toEqual(roomNumber);
    });
  });

  describe('when the client leaves', () => {
    it('should find the client room number', () => {
      spyOn(roomRegistryMock, 'findRoomNumber');

      hotel.findKey(clientId);

      expect(roomRegistryMock.findRoomNumber).toHaveBeenCalled();
    });

    it('should check whether the room is ok', async () => {
      spyOn(housemaidMock, 'checksOutRoom').mockImplementationOnce(async () => {
        return 'allIsOk';
      });

      const roomCheckout: 'allIsOk' | 'towelsMissing' =
        await hotel.checksTheRoomOut(roomNumber);

      expect(housemaidMock.checksOutRoom).toHaveBeenCalledWith(roomNumber);
      expect(roomCheckout).toEqual('allIsOk');
    });

    describe('when paying the bill', () => {
      it('should write the bill transaction in the room registry at the end of the stay', async () => {
        spyOn(roomRegistryMock, 'registerBillPaiement');

        const billAmount: number = await hotel.makesTheClientPay(
          clientId,
          'towelsMissing',
        );

        expect(roomRegistryMock.registerBillPaiement).toHaveBeenCalledWith(
          clientId,
          billAmount,
        );
      });

      it('should pay standard bill when nothing is missing in the room', async () => {
        spyOn(roomRegistryMock, 'registerBillPaiement');

        const nbNights = 1;
        const oneNightCost = 100;
        const moneyAmount = nbNights * oneNightCost;
        await hotel.makesTheClientPay(clientId, 'allIsOk');

        expect(roomRegistryMock.registerBillPaiement).toHaveBeenCalledWith(
          clientId,
          moneyAmount,
        );
      });

      it('should pay fine bill when towels are missing in the room', async () => {
        spyOn(roomRegistryMock, 'registerBillPaiement');

        const nbNights = 1;
        const oneNightCost = 100;
        const fine = 10;
        const moneyAmount = nbNights * oneNightCost + fine;
        await hotel.makesTheClientPay(clientId, 'towelsMissing');

        expect(roomRegistryMock.registerBillPaiement).toHaveBeenCalledWith(
          clientId,
          moneyAmount,
        );
      });
    });

    it('should makes the room clean', async () => {
      spyOn(housemaidMock, 'cleansTheRoom');

      await hotel.cleansTheRoom(roomNumber);

      expect(housemaidMock.cleansTheRoom).toHaveBeenCalledWith(roomNumber);
    });

    it('should makes the room available again after cleaning', async () => {
      spyOn(roomRegistryMock, 'releaseRoom');

      await hotel.cleansTheRoom(roomNumber);

      expect(roomRegistryMock.releaseRoom).toHaveBeenCalledWith(roomNumber);
    });
  });
});
