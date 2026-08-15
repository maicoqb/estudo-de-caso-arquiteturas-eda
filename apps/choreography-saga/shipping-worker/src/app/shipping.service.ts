import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    // Binding explícito (exchange/queue/routingKey) para fins didáticos do estudo de EDA
    await this.brokerService.subscribe(
      'choreography-saga.payment.exchange',
      'choreography-saga.payment.processed.queue',
      'payment.processed',
      (event) => this.handlePaymentProcessed(event),
    );
  }

  private async handlePaymentProcessed(event: any) {
    const { orderId, customerId } = event.data;
    this.logger.log(`Scheduling shipping for order ${orderId}`);

    if (customerId === 'error-shipping') {
      this.logger.error(`Shipping failed for order ${orderId}: invalid address`);

      // Publica evento de falha para acionar compensação em cascata
      await this.brokerService.publish('choreography-saga.shipping.exchange', 'shipping.failed', {
        specversion: '1.0',
        id: `ship-fail-${orderId}`,
        source: 'choreography-saga-shipping-worker',
        type: 'shipping.failed',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: event.data,
      });

      return;
    }

    // Simula agendamento de envio
    this.logger.log(`  Shipping scheduled for order ${orderId}`);

    await this.brokerService.publish('choreography-saga.shipping.exchange', 'shipping.scheduled', {
      specversion: '1.0',
      id: `ship-${orderId}`,
      source: 'choreography-saga-shipping-worker',
      type: 'shipping.scheduled',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }
}
