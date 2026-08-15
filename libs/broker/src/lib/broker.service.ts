import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';

@Injectable()
export class BrokerService implements OnModuleDestroy {
  private connection: amqplib.ChannelModel;
  private channel: amqplib.Channel;
  private readonly logger = new Logger(BrokerService.name);

  constructor(private readonly url: string) {}

  async connect() {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    this.logger.log('Connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
    this.logger.log('Disconnected from RabbitMQ');
  }

  async subscribe(
    exchange: string,
    queue: string,
    routingKey: string,
    handler: (event: any) => Promise<void> | void,
  ) {
    const dlxExchange = `${queue}.dlx`;
    const dlqQueue = `${queue}.dlq`;

    // Configura Dead Letter Queue
    await this.channel.assertExchange(dlxExchange, 'fanout', { durable: true });
    await this.channel.assertQueue(dlqQueue, { durable: true });
    await this.channel.bindQueue(dlqQueue, dlxExchange, '');

    // Configura fila principal com DLQ
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: dlxExchange,
    });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        await handler(JSON.parse(msg.content.toString()));
        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`Failed to process message from ${queue}`, error);
        this.channel.nack(msg, false, false);
      }
    });

    this.logger.log(`Listening on queue: ${queue} [${routingKey}] (DLQ: ${dlqQueue})`);
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
