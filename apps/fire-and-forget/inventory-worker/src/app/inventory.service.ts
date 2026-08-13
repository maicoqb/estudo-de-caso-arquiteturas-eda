import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from './broker/broker.service';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'order.events',
      'order.created.queue',
      'order.created',
      (event) => this.handleOrderCreated(event),
    );
  }

  private handleOrderCreated(event: any) {
    const { orderId, items } = event.data;
    this.logger.log(`Reserving inventory for order ${orderId}`);

    for (const item of items) {
      this.logger.log(`  Reserved ${item.quantity}x product ${item.productId}`);
    }

    // TODO: publicar evento inventory.reserved
  }
}
