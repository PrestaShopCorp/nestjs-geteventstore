fromStream('$test-stream').when({
  $init: function () {
    return {
      count: 0,
    };
  },
  eventtype: function (state, event) {
    state.count += 1;
  },
});
