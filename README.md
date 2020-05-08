# nestjs-eventstore

Event store driven NestJS and CQRS

example is from official Nest JS example

```shell script
docker run -p 22113: -p 11113: -d -n eventstore eventstore/eventstore
yarn
cd examples
yarn
yarn start
```

# Eventstore config

```typescript
@Module({
  imports: [
    EventStoreModule.registerAsync(
      {
        credentials: {
          username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
          password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
        },
        tcp: {
          host: process.env.EVENTSTORE_TCP_HOST || 'localhost',
          port: +process.env.EVENTSTORE_TCP_PORT || 1113,
        },
        http: {
          host: process.env.EVENTSTORE_HTTP_HOST || 'http://localhost',
          port: +process.env.EVENTSTORE_HTTP_PORT || 2113,
        },
        tcpConnectionName: 'connection-hero-event-handler-and-saga',
        onTcpConnected: () => {
        },
        onTcpDisconnected: () => {
        },
      },
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

```

# CQRS

## Aggregate root 
```typescript

export class Hero                   
  ## Change from base cqrs
  extends EventStoreAggregateRoot {
  constructor(private id) {
    super();
    // Where your events are gonna be stored by default
    this.streamConfig = {
      streamName: `hero-${id}`
    } as IStreamConfig;
  }
}
```
## Command handling
```typescript
@CommandHandler(DropAncientItemCommand)
export class DropAncientItemHandler
  implements ICommandHandler<DropAncientItemCommand> {
  constructor(
    private readonly repository: HeroRepository,
    // Only change from base CQRS
    private readonly publisher: EventStorePublisher,
  ) {}

  async execute(command: DropAncientItemCommand) {
    console.log(clc.yellowBright('Async DropAncientItemCommand...'));

    const { heroId, itemId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.addItem(itemId);
    hero.dropItem(itemId);

    hero.commit();
  }
}
```
## Idempotency

### Using event id
Eventstore keep in memory a few million id and deduplicate on this  
means a reboot you don't have idempotency

Add a custom eventId in your event `` 

### Using expectedVersion
Guaranty idempotency even after restart  
Guaranty events order

Bonus define in eventStore the retention rules and stream access rules

Bonus start transaction on a handler, continue it some where else (alpha)

```typescript
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    // Needed 
    private readonly publisher: EventStorePublisher,
  ) {
  }

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    // Use custom stream only for this process
    await hero.setStreamConfig({
      // all next events will have this stream
      streamName: `hero_fight-${heroId}`,
      // Error if the stream is not new when writing
      // You can set your custom order by using this attribute in event
      expectedVersion: ExpectedVersion.NoStream,
     
      // Set retention rules for this new stream
      metadata: {
        // stream is deleted (needs scavenge to be run)
        $maxAge: 2 * DAY,
        // store only the last x events in the stream
        $maxCount: 5,
      },

      (TO FINISH)
      // id of the transaction to start
      transaction: await publisher.startTransaction()
      // Or continue from
      transaction: await this.publisher.continueTransaction(transaction.id)
    });
    hero.damageEnemy(dragonId, 2);
    hero.damageEnemy(dragonId, -8);

    //Write and dispatch events
    hero.commit();

    // Change stream for next events
    await hero.setStreamConfig({
      streamName: `hero-${heroId}`,
      // It must be a new stream
      expectedVersion: ExpectedVersion.NoStream,
    });
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
```


## Saga
Identical to default implementation
```typescript
@Saga()
dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
return events$
  .pipe(
    filter(ev => ev instanceof HeroKilledDragonEvent),
    delay(400),
    map(event => {
      console.log(clc.redBright('Inside [HeroesGameSagas] Saga after a little sleep'));
      return new DropAncientItemCommand(event.data.heroId, itemId);
    }),
  );
}
```
## EventHandler
Identical with nest cqrs if your want.

You win `ack()` and `nack()` if your event extends `AcknowledgeableEventStoreEvent`
(only for persistent subscriptions)

Nack strategies are available
 
```typescript
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler
  implements IEventHandler<HeroKilledDragonEvent> {
  async handle(event: HeroKilledDragonEvent) {
    console.log(clc.greenBright('HeroKilledDragonEventHandler...'));
    await event.ack();
  }
}
```

## Subscription
Sends eventstore events to saga and event handler

Configured from your module config, you can manage multiple tcp subscriptions or catchup in parrallel
in the same bus

Persistent : 
 - realtime   
 - you can ack, nack and 
 - you have a pointer in your event stack.  
 - dedicated interface in eventstore is also available  
  
Catchup : 
 - to start you must tell where you are in the event stack
 - continue to wait for realtime

```typescript
@Module({
  imports: [
    TerminusModule,
    EventStoreCqrsModule.registerAsync(
      {
        credentials: {
          username: process.env.EVENTSTORE_CREDENTIALS_USERNAME || 'admin',
          password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD || 'changeit',
        },
        tcp: {
          host: process.env.EVENTSTORE_TCP_HOST || 'localhost',
          port: +process.env.EVENTSTORE_TCP_PORT || 11113,
        },
        http: {
          host: process.env.EVENTSTORE_HTTP_HOST || 'http://localhost',
          port: +process.env.EVENTSTORE_HTTP_PORT || 22113,
        },
        tcpConnectionName: 'connection-hero-event-handler-and-saga',
        onTcpConnected: () => {
        },
        onTcpDisconnected: () => {
        },
      },
      {
        // Where you map event store incoming event to your format
        eventMapper: (data, options: IEventStoreEventOptions) => {
          let className = `${options.eventType}`;
          Logger.debug(
            `Build ${className} received from stream ${options.eventStreamId} with id ${options.eventId}`,
          );
          if (!heroesEvents[className]) {
            return false;
          }
          return new heroesEvents[className](data, options);
        },
        subscriptions: {
          persistent: [
            {
              // Event stream category (before the -)
              stream: '$ce-hero',
              group: 'data',
              autoAck: false,
              bufferSize: 1,
              // Subscription is created with this options
              options: {
                resolveLinktos: true,
                minCheckPointCount: 1,
              },
              onSubscriptionStart: (subscription) => {
              },
              onSubscriptionDropped: (subscription) => {
              },
            },
          ],
        },
      },
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
```

## Projections
You can code your eventstore projection's in javascript in the project  

Using projection config and the js file 
it asserts that projection exist and run during your app's boot. 

With a projection you can route event to emit new events to another stream.
you can also send linkTo to do symlink like  

https://eventstore.com/docs/getting-started/projections/index.html  
https://eventstore.com/docs/projections/user-defined-projections/index.html

## Terminus health
Give status send 503 on your `HealthController`
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private eventStoreHealthIndicator: EventStoreHealthIndicator,
    private eventStoreBusHealthIndicator: EventStoreBusHealthIndicator,
  ) {
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.eventStoreHealthIndicator.check(),
      async () => this.eventStoreBusHealthIndicator.check(),
    ]);
  }
}
```

## ErrorInterceptor
// TODO subscribe to eventbus subject to send error to any tools 

## Query bus
// TODO code to query the state in the projection
// TO create new query to eventstore ?

## Local Buffering
// TODO : adapt to tcp client and onConnected
// Work with http client and eventstore observer


# HTTP/GRPC/...

It can also be used without CQRS 

### Using it as an interceptor
With this syntax all the output of your services are sent to eventstore

By default only last event will be sent back to http.  

```typescript
@UseInterceptors(EventStoreInterceptor)
@Controller()
export class MyController {
    @Post('/test')
    postMyRoute(
      @Body() body: MyDTO,
    ): Observable<
      | DoneThisEvent
      | DoneThatEvent
      | FinalizedThisEvent
    > {
      return this.myService.doThisAction(body);
    }
}
```

### Using it in a queue
```typescript
@Injectable()
@Processor
export class MyQueue  {
  constructor(
    @Inject(EVENT_STORE_OBSERVER_TOKEN)
    private readonly eventStoreOberver: EventStoreObserver,
    private readonly myService: myService,
  ) {
  }
  @Process('superJob')
  async superbJob(job: Job<WithDataDto>) {
    const dispatcher$ = new Subject();
    dispatcher$.subscribe(this.eventStoreOberver);
    
    this.myService.doThis(job.data)
      .subscribe(dispatcher$);

    return await dispatcher$.toPromise();
  }
}
```
