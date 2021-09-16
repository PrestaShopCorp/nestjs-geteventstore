# Trying EventStoreDb connector

## Note on nodeJS version

You'll find a compatible version you refer to in [this .nvmrc](../.nvmrc). You might want to use nvm direcly, and in this case, nvm will read direcly this configuration file and adjust the version.

## Installation

```
yarn install
```

## Start

You have to run a eventstore container with correct ports. You can put the ports you want, but it will work natively with this conf :

```
docker run --name esdb-node -d \
    -it -p 20113:2113 -p 10113:1113 \
    eventstore/eventstore:latest \
    --insecure \
    --run-projections=All \
    --enable-atom-pub-over-http
```

Then, the REST API will start by running :

```
yarn start
```

## Usage

#### running basic CQRS example with eventStore

The example is based on [CQRS module](https://github.com/kamilmysliwiec/nest-cqrs) usage example of [Nest](https://github.com/kamilmysliwiec/nest) framework.

# Story

The hero fight the dragon in an epic fight.
he kills the dragon, and a dragon can be killed only once.
We need to keep only the last 5 move of the fight and delete them after 3 days for faery RGPD.

When it's done the hero search and find an item.  
He can find this special item only once until he drop hit.

#### How to connect

You can see how the import is done in the [EventStoreHeroesModule](./src/heroes/event-store-heroes.module.ts) :

```typescript
    CqrsEventStoreModule.register(
      eventStoreConnectionConfig,
      eventStoreSubsystems,
      eventBusConfig,
    ),
```

# Let's run it

Once the API is running, you only have to run this REST request :

```
curl -XPUT localhost:3000/hero/200/kill -d'{ "dragonId" : "test3" }'
```

All the events emitted by the example will be stored in the event store.

You can call it multiple time to try idemptotency
see events on [the dashboard](http://localhost:20113/web/index.html#/streams/hero-200) of event store

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

Link with the database (mocked here)

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
