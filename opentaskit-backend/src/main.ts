import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // 4. Swagger / OpenAPI Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OpenTaskit API')
    .setDescription(
      'REST API documentation for OpenTaskit mobile marketplace and admin portal.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `OpenTaskit API server running at http://localhost:${port}/api/v1`,
  );
  console.log(`Swagger Interactive Docs: http://localhost:${port}/api/docs`);
}

void bootstrap();
