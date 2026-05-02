/**
 * Worker 进程入口。
 * 与 API 共享 NestJS Module，但不监听 HTTP 端口；
 * 只跑 BullMQ 的 Processor 和 @nestjs/schedule 的 Cron。
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  await app.init();
  Logger.log('Curio worker is running', 'WorkerBootstrap');

  // Graceful shutdown
  ['SIGINT', 'SIGTERM'].forEach((sig) =>
    process.on(sig, async () => {
      Logger.log(`Received ${sig}, shutting down…`, 'WorkerBootstrap');
      await app.close();
      process.exit(0);
    }),
  );
}

bootstrap();
