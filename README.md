# nestjs-eventstore

# How to
## Configuration

Example config in projects consumming this lib:

```typescript
import { registerAs } from '@nestjs/config';
import { IEventStoreConfig } from 'nestjs-geteventstore';

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
    } as IEventStoreConfig),
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

### Handling events
Events are sent to eventstore and then read from eventstore to do side effects and sagas.

Can be done in same container or on dedicated container for all 

```typescript

const busConfig: EventStoreBusConfig = {
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