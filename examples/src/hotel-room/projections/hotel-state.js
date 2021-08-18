fromStream('hotel-stream').when({
  $init: function () {
    return {
      rooms: [],
      nbAvailableRooms: 0,
      totalRoomNumber: 0,
    };
  },
  ClientReservedRoomEvent: function (state, event) {
    state.rooms[event.body.event.roomNumber - 1] = event.body.event.clientId;
    state.nbAvailableRooms--;
  },
  ClientPaidEvent: function (state, event) {
    for (var i = 0; i < state.rooms.length; i++) {
      if (event.body.event.clientId === state.rooms[i]) {
        state.rooms[i] = '';
      }
    }
    state.nbAvailableRooms++;
  },
  HotelBuiltEvent: function (state, event) {
    state.rooms = Array.from({ length: 3 });
    state.rooms.fill(null);
    state.nbAvailableRooms = event.body.event.nbRooms;
    state.totalRoomNumber = event.body.event.nbRooms;
  },
});
