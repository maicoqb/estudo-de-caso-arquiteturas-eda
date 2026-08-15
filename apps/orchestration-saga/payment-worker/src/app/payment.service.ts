import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'orchestration-saga.commands.exchange',
      'orchestration-saga.process-payment.queue',
      'process-payment',
      (event) => this.handleProcessPayment(event),
    );
  }

  private async handleProcessPayment(event: any) {
    const { orderId, customerId } = event.data;
    this.logger.log(`Processing payment for order ${orderId}`);

    if (customerId === 'error-payment') {
      this.logger.error(`Payment declined for order ${orderId}: card refused`);
      await this.reply('payment.failed', event.data);
      return;
    }

    this.logger.log(`  Payment approved for order ${orderId}`);
    await this.reply('payment.processed', event.data);
  }

  private async reply(routingKey: string, data: any) {
    await this.brokerService.publish('orchestration-saga.replies.exchange', routingKey, {
      specversion: '1.0',
      id: `reply-${routingKey}-${data.orderId}`,
      source: 'orchestration-saga-payment-worker',
      type: routingKey,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data,
    });
  }
}
