import { Module } from '@nestjs/common';
import { BrokerModule } from '@libs/broker';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    BrokerModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    }),
  ],
  providers: [NotificationService],
})
export class AppModule {}
