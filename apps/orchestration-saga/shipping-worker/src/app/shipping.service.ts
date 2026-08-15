import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'orchestration-saga.commands.exchange',
      'orchestration-saga.schedule-shipping.queue',
      'schedule-shipping',
      (event) => this.handleScheduleShipping(event),
    );
  }

  private async handleScheduleShipping(event: any) {
    const { orderId, customerId } = event.data;
    this.logger.log(`Scheduling shipping for order ${orderId}`);

    if (customerId === 'error-shipping') {
      this.logger.error(`Shipping failed for order ${orderId}: invalid address`);
      await this.reply('shipping.failed', event.data);
      return;
    }

    this.logger.log(`  Shipping scheduled for order ${orderId}`);
    await this.reply('shipping.scheduled', event.data);
  }

  private async reply(routingKey: string, data: any) {
    await this.brokerService.publish('orchestration-saga.replies.exchange', routingKey, {
      specversion: '1.0',
      id: `reply-${routingKey}-${data.orderId}`,
      source: 'orchestration-saga-shipping-worker',
      type: routingKey,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data,
    });
  }
}
