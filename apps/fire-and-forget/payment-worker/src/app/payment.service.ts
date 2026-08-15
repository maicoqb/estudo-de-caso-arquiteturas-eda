import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    // Binding explícito (exchange/queue/routingKey) para fins didáticos do estudo de EDA
    await this.brokerService.subscribe(
      'fire-and-forget.inventory.exchange',
      'fire-and-forget.inventory.reserved.queue',
      'inventory.reserved',
      (event) => this.handleInventoryReserved(event),
    );
  }

  private async handleInventoryReserved(event: any) {
    const { orderId, customerId } = event.data;
    this.logger.log(`Processing payment for order ${orderId}`);

    if (customerId === 'error-payment') {
      throw new Error(`Payment declined for order ${orderId}: card refused`);
    }

    // Simula processamento de pagamento
    this.logger.log(`  Payment approved for order ${orderId}`);

    await this.brokerService.publish('fire-and-forget.payment.exchange', 'payment.processed', {
      specversion: '1.0',
      id: `pay-${orderId}`,
      source: 'payment-worker',
      type: 'payment.processed',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }
}
