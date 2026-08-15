import { Module } from '@nestjs/common';
import { BrokerModule } from '@libs/broker';
import { HealthController } from './health.controller';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';

@Module({
  imports: [
    BrokerModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    }),
  ],
  controllers: [HealthController, OrdersController],
  providers: [OrdersService],
})
export class AppModule {}
