import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino-stackdriver';
import { AllExceptionFilter } from '../all-exception.filter';
import HotelRoomModule from './hotel-room.module';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(HotelRoomModule, {
    logger: new Logger(),
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
  app.useGlobalFilters(new AllExceptionFilter());
  await app.listen(3000, () =>
    console.log('Application is listening on port 3000.'),
  );
}

// noinspection JSIgnoredPromiseFromCall
bootstrap();
