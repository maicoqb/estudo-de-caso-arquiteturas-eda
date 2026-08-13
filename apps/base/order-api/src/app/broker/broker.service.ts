import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';

@Injectable()
export class BrokerService implements OnModuleInit, OnModuleDestroy {
  private connection: amqplib.ChannelModel;
  private channel: amqplib.Channel;
  private readonly logger = new Logger(BrokerService.name);

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log('Connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
    this.logger.log('Disconnected from RabbitMQ');
  }

  async publish(exchange: string, routingKey: string, payload: object) {
    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, contentType: 'application/json' },
      );

      this.logger.log(`Published to ${exchange} [${routingKey}]`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${exchange} [${routingKey}]`, error);
    }
  }
}
