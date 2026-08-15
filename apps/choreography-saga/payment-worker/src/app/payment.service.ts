import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    // Binding explícito (exchange/queue/routingKey) para fins didáticos do estudo de EDA
    await this.brokerService.subscribe(
      'choreography-saga.inventory.exchange',
      'choreography-saga.inventory.reserved.queue',
      'inventory.reserved',
      (event) => this.handleInventoryReserved(event),
    );
  }

  private async handleInventoryReserved(event: any) {
    const { orderId, customerId } = event.data;
    this.logger.log(`Processing payment for order ${orderId}`);

    if (customerId === 'error-payment') {
      this.logger.error(`Payment declined for order ${orderId}: card refused`);

      // Publica evento de falha para acionar compensação
      await this.brokerService.publish('choreography-saga.payment.exchange', 'payment.failed', {
        specversion: '1.0',
        id: `pay-fail-${orderId}`,
        source: 'choreography-saga-payment-worker',
        type: 'payment.failed',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: event.data,
      });

      return;
    }

    // Simula processamento de pagamento
    this.logger.log(`  Payment approved for order ${orderId}`);

    await this.brokerService.publish('choreography-saga.payment.exchange', 'payment.processed', {
      specversion: '1.0',
      id: `pay-${orderId}`,
      source: 'choreography-saga-payment-worker',
      type: 'payment.processed',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }
}
