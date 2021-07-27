fromCategory('$et-hero')
  .partitionBy((ev) => ev.data.dragonId)
  .when({
    HeroKilledDragonEvent: (state, event) => {
      emit(`dragon-${event.data.dragonId}`, 'KilledEvent', event.data, {
        specversion: event.metadata.specversion,
        type: event.metadata.type.replace(
          'HeroKilledDragonEvent',
          'KilledEvent',
        ),
        source: event.metadata.source,
        correlation_id: event.metadata.correlation_id,
        time: event.metadata.time,
        version: 1,
      });
      return state;
    },
  });
