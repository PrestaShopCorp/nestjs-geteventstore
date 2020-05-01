import { NestFactory } from '@nestjs/core';
import { EventStoredApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(EventStoredApplicationModule);
  app.listen(3000, () => console.log('Application is listening on port 3000.'));
}
bootstrap();
