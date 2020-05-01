
[Nest](https://github.com/kamilmysliwiec/nest) framework Eventstore [CQRS module](https://github.com/kamilmysliwiec/nest-cqrs) usage example.

## Installation

```
yarn install
```

## Start
```
docker run -d -p 2113:2113 -e EVENSTORE_RUN_PROJECTIONS=System --name geteventstore eventstore/eventstore
yarn start
```

## Usage 
```
curl -XPUT localhost:3000/hero/hero-5421/kill -d'{
  "dragonId" : "test3"
}'
```
Call it multiple time to try idemptotency
see events on http://localhost:2113/web/index.html#/streams/hero-greg (admin/changeit)

## What the code does
 - `heroes.controller` send to the bus a `kill-dragon.command` configured with http body
 - `kill-dragon.handler` fetch the hero and build a `hero.aggregate` merging db and command data
 - `kill-dragon.handler` call killEnemy() on `hero.aggregate`
 - `hero.aggregate` kill the enemy and then apply `hero-killed-dragon.event`
 - `kill-dragon.handler` says everything is  done then comit() `hero.aggregate`
 - Eventstore store the event on the correct stream, it apply idempotency using expected version (mean if you do it twice event is ignored)
 - `hero-killed-dragon.handler` receive the event from Eventstore and log (can run in another process)
 - `heroes-sagas` received the event from Eventstore do some stuff and send to commandBus `drop-ancient-item-command`
 - `drop-ancient-item.handler` fetch the hero and build a `hero.aggregate`  merging db and command data
 - `drop-ancient-item.handler` addItem() on `hero.aggregate` 
 - `hero.aggregate` apply `hero-found-item.event`
 - `drop-ancient-item.handler` dropItem() on `hero.aggregate` 
 - `hero.aggregate` apply `hero-drop-item.event`
 - `kill-dragon.handler` says everything is done then comit() `hero.aggregate`
 