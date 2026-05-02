import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'docs'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swagger = new DocumentBuilder()
    .setTitle('Curio API')
    .setDescription('Event aggregation platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, doc);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Curio API listening on :${port}`, 'Bootstrap');
}

bootstrap();
