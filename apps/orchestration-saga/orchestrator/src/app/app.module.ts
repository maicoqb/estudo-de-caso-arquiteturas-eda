import { Module } from '@nestjs/common';
import { BrokerModule } from '@libs/broker';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [
    BrokerModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    }),
  ],
  providers: [OrchestratorService],
})
export class AppModule {}
