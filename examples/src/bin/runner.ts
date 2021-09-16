import { NestFactory } from '@nestjs/core';
import { AllExceptionFilter } from '../all-exception.filter';
import { EventStoreHeroesModule } from '../heroes/event-store-heroes.module';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(
    EventStoreHeroesModule,
    {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    },
  );

  app.useGlobalFilters(new AllExceptionFilter());
  await app.listen(3000, () => {
    console.log('Application is listening on port 3000.');
  });
}

process.once('uncaughtException', (e: Error) => {
  if (e['code'] !== 'ERR_STREAM_WRITE_AFTER_END') {
    throw e;
  }
});
bootstrap();
