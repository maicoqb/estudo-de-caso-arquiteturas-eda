import { DynamicModule, Logger, Module } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { BrokerService } from './broker.service';

interface BrokerModuleOptions {
  url: string;
}

@Module({})
export class BrokerModule {
  static forRoot(options: BrokerModuleOptions): DynamicModule {
    return {
      module: BrokerModule,
      global: true,
      providers: [
        {
          provide: BrokerService,
          useFactory: async () => {
            const connection = await amqplib.connect(options.url);
            const channel = await connection.createChannel();
            Logger.log('Connected to RabbitMQ', 'BrokerModule');
            return new BrokerService(connection, channel);
          },
        },
      ],
      exports: [BrokerService],
    };
  }
}
