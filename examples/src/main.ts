import { NestFactory } from '@nestjs/core';
import { EventStoredApplicationModule } from './app.module';
import { SentryExceptionFilter } from './sentry.exception-filter';
import { Logger } from 'nestjs-pino-stackdriver/dist';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(EventStoredApplicationModule, {
    logger: new Logger(),
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
  app.useGlobalFilters(new SentryExceptionFilter());
  await app.listen(3000, () =>
    console.log('Application is listening on port 3000.'),
  );
}

bootstrap();
