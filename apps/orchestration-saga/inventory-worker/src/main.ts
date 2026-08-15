import 'dotenv/config';
import { initTracing } from '@libs/tracing';
initTracing('orchestration-saga-inventory-worker');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  Logger.log('🚀 Orchestration Saga - Inventory worker is running');
}

bootstrap();
