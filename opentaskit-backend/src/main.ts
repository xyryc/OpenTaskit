import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global API prefix & versioning (excludes root health routes)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health'],
  });

  // 2. global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 3. global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `OpenTaskit API server running at http://localhost:${port}/api/v1`,
  );
}
void bootstrap();
