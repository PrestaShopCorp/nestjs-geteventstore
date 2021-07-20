# Updating connector, what's new

## Version 5.0.0

The connector is updated, and the deprecated version of EventStore client is not maintained anymore.

1. EventStore Client

The usage is switching to the official
client [EventStore client](https://developers.eventstore.com/clients/grpc/getting-started/)

2. App startup

Connecting to the module is now done only by providing a conf that you can find here :

[src/event-store/config/event-store-connection-config.ts](./src/event-store/config/event-store-connection-config.ts)

The conf and all the objects are now (or willing to be) strongly typed, so it's easy to know what option is needed.

3. EventStore configuration

You can give a strongly typed conf representing the persistent subscriptions and the projections, at the startup :

[src/event-store/config/event-store-service-config.interface.ts](./src/event-store/config/event-store-service-config.interface.ts)

The main diff is that we have now to fill it with a creation conf and a connection conf. They are not the same anymore (
in order to match the es client's process).

4. Methods signature

Some EventStoreService methods have see there signature changed to suit at best the interfaces of the new client :

[src/event-store/services/event-store.service.interface.ts](./src/event-store/services/event-store.service.interface.ts)

6. Exemple : how to connect

First step : prepare your eventstore connection configuration, like this :

```typescript
const eventStoreConnectionConfig: EventStoreConnectionConfig = {
  connectionSettings: {
    connectionString:
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
  },
  defaultUserCredentials: {
    username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
    password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
  },
};
```

Then, you must provide the list of subsystems you want to configure (projections/persistent subscriptions) :

```typescript
const eventStoreSubsystems: IEventStoreSubsystems = {
  subscriptions: {
    persistent: [
      {
        stream: '$ce-hero',
        group: 'data',
        settingsForCreation: {
          subscriptionSettings: {
            resolveLinkTos: true,
            minCheckpointCount: 1,
          },
        },
        onError: (err: Error) =>
          console.log(`An error occured : ${err.name}, ${err.message}`),
      },
    ],
  },
  projections: [
    {
      name: 'hero-dragon',
      file: resolve(`${__dirname}/projections/hero-dragon.js`),
      mode: 'continuous',
      enabled: true,
      checkPointsEnabled: true,
      emitEnabled: true,
    },
  ],
  onConnectionFail: (err: Error) =>
    console.log(`Connection to Event store hooked : ${err}`),
};
```

**Note on error callbacks**

- the onError callback will be triggered when the subscription will face a unexpected issue (for example : EventStore
  connection is closed). This allows you to stack your events/do anything else.
- Same, you have now a `onConnectionFail` that you can give to the conf. This will be triggered if the connection to EventStore is failing, while you try to write event(s).

Again, all of these configurations are strongly typed, you can check the interfaces to know what options are needed or
not.

Note: for creation options, even if you do not provide all options needed, the system will fill it with default values,
given by calling the `persistentSubscriptionSettingsFromDefaults` method provided by the client lib.

Then, one last step, you have to provide the readBus and writeBus options, like previously.

In your module, you then have to import the `CqrsEventStoreModule` like this way :

```typescript
@Module({
  controllers: [
    // ... OtherControllers
  ],
  providers: [
    // ... OtherProviders
  ],
  imports: [
    OtherModules,
    CqrsEventStoreModule.register(
      eventStoreConnectionConfig,
      eventStoreSubsystems,
      eventBusConfig,
    ),
  ],
})
export class YourCoolFeatureModule {}
```

Because the connection is at module init, once the app is started, all the projections and persistent subscriptions
provided are asserted. You can get the subscriptions by this way :

```typescript
EventStoreService.getPersistentSubscriptions();
```

### Update with command handlers and the aggregate

The main difference with the command handlers concerns the commit parameter. Now, the signature is this one :

```typescript
interface ExampleAggregate {
  commit(
    expectedRevision: AppendExpectedRevision = constants.ANY,
    expectedMetadataRevision: AppendExpectedRevision = constants.ANY,
  );
}
```

The constants are findable here :

[@eventstore/db-client/dist/constants.d.ts](./node_modules/@eventstore/db-client/dist/constants.d.ts)

The possibilities are :

`constants.NO_STREAM | constants.STREAM_EXISTS | constants.ANY | bigint;`

Note that if you want to declare a bigint at this place, you have to do like this :

```typescript
const veryBigInt: bigint = BigInt(1234);
```

In the command handler, when you want to commit, you should then provide the right value for expected versions.

### Failing strategy

By default, the failing strategy keeps in memory the event batches, while the connection to the store is down. Each time you try to write events, the system will try to rewrite all the events stacked in the right order with the correct stream and expected revision.

You may want to override this mechanism. To do so, the only thing you have to provide is `EVENT_STACKER` service, like this in your module :

```typescript
        {
          provide: EVENT_AND_METADATAS_STACKER,
          useClass: InMemoryEventsAndMetadatasStacker
        }
```

`InMemoryEventsAndMetadatasStacker` is the devault value. you juste have to add a service that matches the interface [IEventsAndMetadatasStacker](./src/event-store/config/connection-fallback/interface/events-and-metadatas-stacker.ts)

Note that it works the same way for the metadatas.
