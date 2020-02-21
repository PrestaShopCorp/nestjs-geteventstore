# nestjs-eventstore

---

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

To init the module as a writer:

```typescript
EventStoreModule.forRootAsync({
      useFactory: async (config: ConfigService) => config.get('eventstore'),
      inject: [ConfigService],
    }),
```
