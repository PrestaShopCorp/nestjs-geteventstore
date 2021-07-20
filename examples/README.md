# Trying EventStoreDb connector

## Installation

```
yarn install
```

## Start

You have to run a eventstore container with correct ports. You can put the ports you want, but it will work natively with this conf :

```
docker run --name esdb-node \
    -it -p 20113:2113 -p 10113:1113 \
    eventstore/eventstore:latest \
    --insecure \
    --run-projections=All \
    --enable-atom-pub-over-http
```

Then, you can see in the directory `/examples/src/event-store-usages` a serie of sub directory showing some example. You can run it by using the `/examples/src/package.json`, by running the corresponding example you want to try. For instance, if you want to play with persistent subscriptions, you can run :

```
yarn start:esdb:pers-sub
```

Then, the REST API will start.

## Usage

#### Writing one event

```
curl -XGET localhost:3000/event-writer/write-one-event/<optional : the stream name>
```

#### Writing a batch of events

```
curl -XGET localhost:3000/event-writer/write-event-batch/<optional : the stream name>
```

#### Reading on a stream

```
curl -XGET localhost:3000/stream-reader/$test-stream/<optional : the stream name>
```

# Trying CQRS with event store - Hotel reservation example

# Story

You are a hotel manager, and you want to be able to take reservations, welcome clients,checkout rooms, get the bills etc.

#Installation

```
cd examples/
yarn
```

#Start server

```
cd examples/
yarn run start:hotel-room
```

Listening on port 3000 you have now a rest API that you can request to see the behavior of the hotel.

#Usage
Using curl, you can request this API. You can find all possible request into the controller file :

```
examples/src/hotel-room/hotel-room.controller.ts
```

Then, you can use curl to request the API :

```
curl -i localhost:3000/path-to-api/arg1/arg2/...
```

For example, if you want to reinit the hotel, by rebuilding it with 10 rooms, then run :

```
curl -i localhost:3000/hotel-room/build/10
```

#Behavior in a nutshell
(prerequisite : you need to know cqrs basic concepts)

Staying in the example of the previous command (reinit hotel state), here is what happens :

First it will execute corresponding command on the commandBus. The command will be dispatch to its handlers by the cqrs lib asynchronously. Then, the `BuildNewHotelCommandHandler` will execute this command, and send back a commandResponse chen it's done. Then you can see if something failed or if everything went ok.

First, the commandHandler loads the last state of the aggregate, which is the model (here, it's in the domain folder, in this hexagonal architecture). It will run the correct command with the given args, and get a response. At this stage, if anything went ok, the corresponding event where emitted (`HotelBuiltEvent`).

The point is that this example uses event store to... store events. You can see that the eventBus is not the standard nestjs cqrs one. this ESEventBus is a overlay on the standard EventBus. Basically, its behavior is to publish an event while the system standardly publish one. The other particularity is that at module init, it will connect and keep in memory all subscriptions, and projection that you want to get. You can see that in this module :

```
examples/src/hotel-room/hotel-room.module.ts
```

Let's see the import :

```
  imports: [
    EventStoreCqrsModule.connect(
      process.env.CONNECTION_STRING || 'esdb://localhost:20113?tls=false',
      esConfig
    )
  ]
```

As you can see, no more need for importing CqrsModule, juste this one, fed with the connection string to EventStore, and the configuration esConfig, strongly typed to help you giving it what you need.

Other interesting point : the hotel repository, that you can find here :

```
examples/src/hotel-room/repositories/hotel.event-store.repository.ts
```

This repo is able to replay all events appends to the hotel main stream, and is able to "reconstruct" the state of the model. It makes that you can ask it anything at anytime, it's always up to date (hat is how it know free rooms remaining and who are the room owners). A big ugly if/else is here to add behavior to the model at startup

Note that using `EventStoreCqrsModule` still allows you to use standard NestJS CQRS standard EventBus.

You can basically find in the sources of this example the same behavior either for command, or queries or events. And you can see example of how you can unit test that.

# Trying CQRS - Hero example

[Nest](https://github.com/kamilmysliwiec/nest) framework Eventstore [CQRS module](https://github.com/kamilmysliwiec/nest-cqrs) usage example.

# Story

The hero fight the dragon in an epic fight.
he kills the dragon, and a dragon can be killed only once.
We need to keep only the last 5 move of the fight and delete them after 3 days for faery RGPD.

When it's done the hero search and find an item.  
He can find this special item only once until he drop hit.

## Installation

```
yarn install
```

## Start

```
docker run -d -p 2113:2113 -p 1113:1113 -e EVENSTORE_RUN_PROJECTIONS=System --name geteventstore eventstore/eventstore
yarn start // or yarn start:<cqrs | eventstore | subscription | write>
```

## Usage

```
curl -XPUT localhost:3000/hero/hero-5421/kill -d'{
  "dragonId" : "test3"
}'
```

Call it multiple time to try idemptotency
see events on http://localhost:2113/web/index.html#/streams/hero-5421 (admin/changeit)

## What the code does

- `heroes.controller` send to the command bus `kill-dragon.command` configured with http body
- `kill-dragon.handler` fetch the hero and build a `hero.aggregate` merging db and command data
- `kill-dragon.handler` call killEnemy() on `hero.aggregate`
- `hero.aggregate` kill the enemy and apply `hero-killed-dragon.event`
- `kill-dragon.handler` commit() on `hero.aggregate` (write all events on aggregate)
- Eventstore stores the event on event's stream, applying idempotency (mean if you do it twice event is ignored the other times)
- `hero-killed-dragon.handler` receive the event from Eventstore and log (can run in another process)
- `heroes-sagas` receive the event from Eventstore do some logic and send to commandBus `drop-ancient-item-command`
- `drop-ancient-item.handler` fetch the hero and build a `hero.aggregate` merging db and command data
- `drop-ancient-item.handler` addItem() on `hero.aggregate`
- `hero.aggregate` apply `hero-found-item.event`
- `drop-ancient-item.handler` dropItem() on `hero.aggregate`
- `hero.aggregate` apply `hero-drop-item.event`
- `kill-dragon.handler` commit() on `hero.aggregate` (can be done after each call)
- Eventstore store the event on event's stream

## Data transfer object

Stupid data object with optionnals validation rules

## Repository

Link with the database

## Aggregate Root

Where everything on an entity and it's child appends.  
Updated only using events

## Command

Data transfer object with a name that you must execute

## Command handler

Do the logic :
Read the Command, merge DB and command's data on the Aggregate, play with aggregate's methods, commit one or multiple time when needed

## Event

Data transfer object with a name and a stream name.  
Can have a UUID, metadata and an expected version

## Event Handler

Do the side effects.
Receive event and do logic with them : usually update or insert on the database

## Saga

Side effects that create new commands.
Receive events and return one or more commands.
