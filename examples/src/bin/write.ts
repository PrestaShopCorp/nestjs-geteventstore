import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino-stackdriver';
import { AllExceptionFilter } from '../all-exception.filter';
import { EventStoreHeroesModule } from '../heroes/event-store-heroes.module';

async function bootstrap() {
  const app = await NestFactory.create(
    EventStoreHeroesModule.registerWriteBus(),
    {
      logger: new Logger(),
    },
  );

  app.useGlobalFilters(new AllExceptionFilter());
  await app.listen(3000, () =>
    console.log('Application is listening on port 3000.'),
  );
}

bootstrap();
