# Trying EventStoreDb connector

## Installation

```
yarn install
```

## Start

You have to run a eventstore container with correct ports. You can put the ports you want, but it will work natively with this conf :

```
docker run -d -p 20113:2113 -p 10113:1113 -e EVENSTORE_RUN_PROJECTIONS=System --name geteventstore eventstore/eventstore
```

Then, you can see in the directory `/examples/src/event-store-usages` a serie of sub directory showing some example. You can run it by using the `/examples/src/package.json`, by running the corresponding example you want to try. For instance, if you want to play with persistent subscriptions, you can run :

```
yarn start:esdb:pers-sub
```

Then, the REST API will start.

## Usage

In the controllers file, you will find what url you have to try. For instance, you can do :

```
curl -XGET localhost:3000/persistent-subscription
```

# Trying CQRS

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
