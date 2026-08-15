import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { trace, context, propagation, SpanKind, SpanStatusCode, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('broker');

@Injectable()
export class BrokerService implements OnModuleDestroy {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private readonly connection: amqplib.ChannelModel,
    private readonly channel: amqplib.Channel,
  ) {}

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
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      await this.withSpan(`consumed ${routingKey} ← ${exchange}`, SpanKind.CONSUMER, msg.properties.headers, async () => {
        try {
          await handler(JSON.parse(msg.content.toString()));
          this.channel.ack(msg);
        } catch (error) {
          this.channel.nack(msg, false, false);
          throw error;
        }
      });
    });

    this.logger.log(`Listening on queue: ${queue} [${routingKey}]`);
  }

  async publish(exchange: string, routingKey: string, payload: object) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    await this.withSpan(`published ${routingKey} → ${exchange}`, SpanKind.PRODUCER, undefined, async (_, headers) => {
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, contentType: 'application/json', headers },
      );
    });
  }

  private async withSpan(
    name: string,
    kind: SpanKind,
    incomingHeaders: Record<string, unknown> | undefined,
    fn: (span: Span, outgoingHeaders: Record<string, string>) => Promise<void>,
  ) {
    const parentContext = incomingHeaders
      ? propagation.extract(context.active(), incomingHeaders)
      : context.active();

    const span = tracer.startSpan(name, { kind }, parentContext);
    const spanContext = trace.setSpan(parentContext, span);

    const outgoingHeaders: Record<string, string> = {};
    propagation.inject(spanContext, outgoingHeaders);

    try {
      await context.with(spanContext, () => fn(span, outgoingHeaders));
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      span.recordException(error as Error);
    } finally {
      span.end();
    }
  }
}
