import { Module } from '@nestjs/common';
import { BrokerModule } from '@libs/broker';
import { ShippingService } from './shipping.service';

@Module({
  imports: [
    BrokerModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    }),
  ],
  providers: [ShippingService],
})
export class AppModule {}
