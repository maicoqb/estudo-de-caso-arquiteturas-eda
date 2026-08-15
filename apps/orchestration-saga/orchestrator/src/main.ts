import 'dotenv/config';
import { initTracing } from '@libs/tracing';
initTracing('orchestration-saga-orchestrator');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  Logger.log('🚀 Orchestration Saga - Orchestrator is running');
}

bootstrap();
