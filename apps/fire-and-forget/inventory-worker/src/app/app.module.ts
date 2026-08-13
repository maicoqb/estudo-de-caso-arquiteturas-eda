import { Module } from '@nestjs/common';
import { BrokerModule } from './broker/broker.module';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    BrokerModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    }),
  ],
  providers: [InventoryService],
})
export class AppModule {}
