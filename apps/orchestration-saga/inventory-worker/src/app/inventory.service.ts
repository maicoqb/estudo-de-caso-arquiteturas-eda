import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'orchestration-saga.commands.exchange',
      'orchestration-saga.reserve-inventory.queue',
      'reserve-inventory',
      (event) => this.handleReserveInventory(event),
    );

    await this.brokerService.subscribe(
      'orchestration-saga.commands.exchange',
      'orchestration-saga.release-inventory.queue',
      'release-inventory',
      (event) => this.handleReleaseInventory(event),
    );
  }

  private async handleReserveInventory(event: any) {
    const { orderId, items, customerId } = event.data;
    this.logger.log(`Reserving inventory for order ${orderId}`);

    if (customerId === 'error-inventory') {
      this.logger.error(`Product out of stock for order ${orderId}`);
      await this.reply('inventory.reserve-failed', event.data);
      return;
    }

    for (const item of items) {
      this.logger.log(`  Reserved ${item.quantity}x product ${item.productId}`);
    }

    await this.reply('inventory.reserved', event.data);
  }

  private async handleReleaseInventory(event: any) {
    const { orderId, items } = event.data;
    this.logger.log(`⬅️ Releasing inventory for order ${orderId}`);

    for (const item of items) {
      this.logger.log(`  Released ${item.quantity}x product ${item.productId}`);
    }

    await this.reply('inventory.released', event.data);
  }

  private async reply(routingKey: string, data: any) {
    await this.brokerService.publish('orchestration-saga.replies.exchange', routingKey, {
      specversion: '1.0',
      id: `reply-${routingKey}-${data.orderId}`,
      source: 'orchestration-saga-inventory-worker',
      type: routingKey,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data,
    });
  }
}
