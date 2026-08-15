import 'dotenv/config';
import { initTracing } from '@libs/tracing';
initTracing('inventory-worker');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  Logger.log('🚀 Inventory worker is running');
}

bootstrap();
