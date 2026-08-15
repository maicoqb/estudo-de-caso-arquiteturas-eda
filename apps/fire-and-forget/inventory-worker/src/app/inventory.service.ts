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
      'fire-and-forget.order.created.queue',
      'order.created',
      (event) => this.handleOrderCreated(event),
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

    await this.brokerService.publish('fire-and-forget.inventory.exchange', 'inventory.reserved', {
      specversion: '1.0',
      id: `inv-${orderId}`,
      source: 'inventory-worker',
      type: 'inventory.reserved',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
    });
  }
}
