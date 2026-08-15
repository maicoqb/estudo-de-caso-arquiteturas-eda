import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    // Binding explícito (exchange/queue/routingKey) para fins didáticos do estudo de EDA
    await this.brokerService.subscribe(
      'order.exchange',
      'choreography-saga.order.created.queue',
      'order.created',
      (event) => this.handleOrderCreated(event),
    );

    // Escuta evento de falha do payment para compensar (liberar estoque)
    await this.brokerService.subscribe(
      'choreography-saga.payment.exchange',
      'choreography-saga.payment.failed.queue',
      'payment.failed',
      (event) => this.handlePaymentFailed(event),
    );
  }

  private async handleOrderCreated(event: any) {
    const { orderId, items, customerId } = event.data;
    this.logger.log(`Reserving inventory for order ${orderId}`);

    if (customerId === 'error-inventory') {
      throw new Error(`Product out of stock for order ${orderId}`);
    }

    for (const item of items) {
      this.logger.log(`  Reserved ${item.quantity}x product ${item.productId}`);
    }

    await this.brokerService.publish('choreography-saga.inventory.exchange', 'inventory.reserved', {
      specversion: '1.0',
      id: `inv-${orderId}`,
      source: 'choreography-saga-inventory-worker',
      type: 'inventory.reserved',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }

  private async handlePaymentFailed(event: any) {
    const { orderId, items } = event.data;
    this.logger.log(`⬅️ Compensating: releasing inventory for order ${orderId}`);

    for (const item of items) {
      this.logger.log(`  Released ${item.quantity}x product ${item.productId}`);
    }

    await this.brokerService.publish('choreography-saga.inventory.exchange', 'inventory.released', {
      specversion: '1.0',
      id: `inv-release-${orderId}`,
      source: 'choreography-saga-inventory-worker',
      type: 'inventory.released',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }
}
