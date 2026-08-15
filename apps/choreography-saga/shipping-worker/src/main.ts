import 'dotenv/config';
import { initTracing } from '@libs/tracing';
initTracing('choreography-saga-shipping-worker');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  Logger.log('🚀 Choreography Saga - Shipping worker is running');
}

bootstrap();
