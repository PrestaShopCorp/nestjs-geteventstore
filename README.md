# nestjs-eventstore

Event store driven NestJS and CQRS

### How to use it

You'll find how to use it [in the basic nest CQRS example documentation](./examples/README.md)

Just as a reminder, you'll find here the commands for running the event store docker :

```
docker run --name esdb-node \
    -it -p 20113:2113 -p 10113:1113 \
    eventstore/eventstore:latest \
    --insecure \
    --run-projections=All \
    --enable-atom-pub-over-http
```
