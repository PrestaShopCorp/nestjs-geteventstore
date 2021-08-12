import Hotel from './hotel';
import { RoomRegistry } from './room-registry';
import { ClientNotifier } from './client-notifier';
import Room from './room';
import Client from './client';
import HouseMaid from './house-maid';
import spyOn = jest.spyOn;

describe('Hotel use cases', () => {
  let hotel: Hotel;

  const clientId = 'id';
  const client: Client = new Client(clientId);

  const arrival: Date = new Date();
  const checkout: Date = new Date();

  const room: Room = new Room(101);

  const housemaidMock: HouseMaid = {
    cleansTheRoom(room: Room): void {},
    async checksOutRoom(room: Room): Promise<'allIsOk' | 'towelsMissing'> {
      return 'allIsOk';
    },
  };
  const roomRegistryMock: RoomRegistry = {
    releaseRoom(room: Room): Promise<void> {
      return Promise.resolve();
    },
    async reserveAvailableRoom(): Promise<Room | null> {
      return room;
    },
  };
  const clientNotifier: ClientNotifier = {
    notifyClientByEmail(clientId: string): Promise<void> {
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
        client,
        arrival,
        checkout,
      );

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalled();
      expect(needToCheckAnotherHotel).toBeFalsy();
    });

    it('should send a confirmation email when a room is reserved', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom').mockImplementationOnce(
        async (): Promise<Room> => {
          return new Room(101);
        },
      );
      spyOn(clientNotifier, 'notifyClientByEmail');

      await hotel.reserveRoom(client, arrival, checkout);

      expect(clientNotifier.notifyClientByEmail).toHaveBeenCalled();
    });

    it('should get available room identifier when reserving and hotel is not full', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom');

      const availableRoom: Room = await hotel.reserveRoom(
        client,
        arrival,
        checkout,
      );

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalled();
      expect(availableRoom.getNumber()).toBeTruthy();
    });

    it('should associate a reserved room with client id, arrival and checkout dates when room is available', async () => {
      spyOn(roomRegistryMock, 'reserveAvailableRoom');

      await hotel.reserveRoom(client, arrival, checkout);

      expect(roomRegistryMock.reserveAvailableRoom).toHaveBeenCalledWith(
        client.getId(),
        arrival,
        checkout,
      );
    });
  });

  describe('when client arrives at the hotel', () => {
    it('should give the client the room key when she arrives', () => {
      spyOn(client, 'takeTheRoomKey');

      hotel.givesKeyToClient(client, room);

      expect(client.shouldOwnsTheRoomKey()).toBeTruthy();
      expect(client.takeTheRoomKey).toHaveBeenCalledWith(room.getNumber());
    });
  });

  describe('when the client leaves', () => {
    it('should check whether the room is ok', async () => {
      spyOn(housemaidMock, 'checksOutRoom').mockImplementationOnce(async () => {
        return 'allIsOk';
      });

      const roomCheckout: 'allIsOk' | 'towelsMissing' =
        await hotel.checksTheRoomOut(room);

      expect(housemaidMock.checksOutRoom).toHaveBeenCalledWith(room);
      expect(roomCheckout).toEqual('allIsOk');
    });

    it('should proceed to payement', async () => {
      spyOn(client, 'payTheBill');

      const nbNights = 5;
      const oneNightCost = 100;
      const moneyAmount = nbNights * oneNightCost;
      await hotel.makesTheClientPay(client, moneyAmount);

      expect(client.payTheBill).toHaveBeenCalledWith(moneyAmount);
    });

    it('should makes the room clean', async () => {
      spyOn(housemaidMock, 'cleansTheRoom');

      await hotel.cleansTheRoom(room);

      expect(housemaidMock.cleansTheRoom).toHaveBeenCalledWith(room);
    });

    it('should makes the room available again after cleaning', async () => {
      spyOn(roomRegistryMock, 'releaseRoom');

      await hotel.cleansTheRoom(room);

      expect(roomRegistryMock.releaseRoom).toHaveBeenCalledWith(room);
    });
  });
});
