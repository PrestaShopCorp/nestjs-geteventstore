# nestjs-eventstore

# How to
## Configuration

Example config in projects consumming this lib:

```typescript
import { registerAs } from '@nestjs/config';
import { EventStoreConfigInterface } from 'nestjs-geteventstore';

export default registerAs(
  'eventstore',
  () =>
    ({
      credentials: {
        username: process.env.EVENTSTORE_CREDENTIALS_USERNAME,
        password: process.env.EVENTSTORE_CREDENTIALS_PASSWORD,
      },
      tcp: {
        host: process.env.EVENTSTORE_TCP_HOST || 'localhost',
        port: process.env.EVENTSTORE_TCP_PORT || 1113,
      },
      http: {
        host: process.env.EVENTSTORE_HTTP_HOST || 'http://localhost',
        port: process.env.EVENTSTORE_HTTP_PORT || 2113,
      },
      options: {
        heartbeatInterval: 3000,
        heartbeatTimeout: 1000,
      }
    } as EventStoreConfigInterface),
);
```


## CQRS
Using it in CQRS is straightforward

### Write events

see https://github.com/kamilmysliwiec/nest-cqrs-example
just add on import

```typescript

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EventStoreConfig],
    }),
    EventStoreCqrsModule.forRootAsync(
      {
        inject: [ConfigService],
        useFactory: async (config: ConfigService) => config.get('eventstore'),
      },
      {},
    ),
  ],
})
export class ProjectionDataModule {}
```

### Minimal event definitions

```typescript 
import { IAggregateEvent } from '../../../../../src';
import { v4 } from 'uuid';

export class HeroDropItemEvent implements IAggregateEvent {
  // Set data and metadata on constructor
  constructor(
    // Put wath ever you want in this
    public readonly data: {
      heroId: string,
      itemId: string
    }) {
  }
  // Mandatory if none error will be thrown
  // Eventstore split at first - to define category
  // here category is 'hero' I can get all events with stream $ce-hero
  get streamName() {
    return `hero-${this.data.heroId}`;
  }

  // Optionnal but so usefull
  get metadata() {
    return {
      version: 1,
      created_at: new Date(),
    };
  }
  // Optionnal default is uuid-v4
  // if you build your own id, eventstore can manage idempotency
  // caution if eventstore is rebooted, duplicate ID can exist
  get id() {
    return v4();
  }
  // Optionnal default is ignore version
  // Best way to garanty idempotency even after eventsore reboot
  // can be an integer or https://github.com/EventStore/documentation/blob/master/http-api/optional-http-headers/expected-version.md
  get expectedVersion() {
    return ExpectedVersion.NoStream;
  }
}

```

### Handling events
Events are sent to eventstore and then read from eventstore to do side effects and sagas.

Can be done in same container or on dedicated container for all 

```typescript

const busConfig: EventStoreBusConfigInterface = {
  eventMapper: eventBuilder,
  subscriptions: {
    persistent: [
      {
        stream: '$ce-my_stream',
        group: 'data',
        autoAck: false,
        bufferSize: 10,
        onSubscriptionDropped: (sub, reason, error) => {
          Logger.error(`Subscription dropped : ${reason} ${error}, die in 5s`);
          process.exit(137);
        },
        // Subscription is created with this options
        options: {
          resolveLinktos: true,
          minCheckPointCount: 1,
        },
      },
    ],
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EventStoreConfig],
    }),
    EventStoreCqrsModule.forRootAsync(
      {
        inject: [ConfigService],
        useFactory: async (config: ConfigService) => config.get('eventstore'),
      },
      busConfig,
    ),
  ],
  providers: [
    MyEventHandler,
  ],
})
export class ProjectionDataModule {}

```

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@EventsHandler(DoneThisEvent)
export class MyEventHandler
  implements
    IEventHandler<DoneThisEvent> {
  constructor(
    private readonly myRepository: myRepository,
  ) {}

  async handle(event: DoneThisEvent) {
    try {
        const shopId = event.getStreamId();
        const createdAt = new Date(event.metadata.created_at);
        const realMerchantId = await this.myRepository.getById(event.data.id);
        event.ack();
    }
    catch(e) {
      event.nack(PersistentSubscriptionNakEventAction.Park, e.message);
    }
  }
}

```

## HTTP/GRPC/...

It can also be used without CQRS 

### Import module
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventStoreInterceptor, EventStoreModule } from 'nestjs-geteventstore';
@Module({
    imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        EventstoreConfig,
      ],
    }),
    EventStoreModule.forRootAsync({
      useFactory: async (config: ConfigService) => config.get('eventstore'),
      inject: [ConfigService],
    }),
    ],
    controllers: [MyController],
    providers: [],
})
export class AppModule {}
```
### Using it as an interceptor
With this syntax all the output of your services are sent to eventstore

Latest event will be sent back to http.

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

## SOA 2
https://en.wikipedia.org/wiki/Event-driven_SOA

Can run at Controller or Processor level or Service 

```typescript
@EventDriven({ 
  // Prefix for eventStreamId auto generate
  domain: 'order', 
  // Customize observer to write events to
  eventStoreInstance: EventStoreObserver,
  // Can be set also at app level
  bufferWithTime: '10s',
  bufferWithCount: 100,
  // for this domain the projection
  // name is source-target
  projections: [
    // Run inside eventstore to route, group, rename, ... events
    // example link or copy some order_create, order_edit events in an order stream for overview
    'projection/order.js'
  ] 
})
class OrderService {
    // Method Decorator and Class Decorator ?
    @StoreEvents({
      // Optional generated with domain-methodName-eventId in payload || uuidv4
      // accessible in projection with $ce-order_create 
      streamName: (order, method) => `order_create-${order.id}`,
      // Optional Default to false
      transaction: true,
      // Optional role access on eventstore
      permissions: ['$admin'],
      // Default any, in which state the stream should be when writing
      // Here nothing should exist before 
      expectedVersion: ExpectedVersion.NoStream,
      // Optional Retention rules default keep for long time
      maxAge: '3d',
      maxKeep: 10000,
    })
    create(order) : Observable<IEvent> {
      
    }
    edit(order) : Observable<IAggregateEvent> {
      
    }
}
```

```

```

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@EventsHandler(DoneThisEvent)
export class MyEventHandler implements IEventHandler<DoneThisEvent> {
  constructor(private readonly myRepository: myRepository,) {}

  async handle(event: DoneThisEvent) {
    try {
        const doneId = event.getStreamId();
        const createdAt = new Date(event.metadata.created_at);
        const currentId = await this.myRepository.getById(event.data.id);
        if(doneId != currentId) {
          throw new Error('!!');
        }  
        event.ack();
    }
    catch(e) {
      event.nack(PersistentSubscriptionNakEventAction.Park, e.message);
    }
  }
}

```