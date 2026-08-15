import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'order.exchange',
      'orchestration-saga.order.created.queue',
      'order.created',
      (event) => this.handleOrderCreated(event),
    );
  }

  private async handleOrderCreated(event: any) {
    const { orderId } = event.data;
    this.logger.log(`Saga started for order ${orderId}`);

    // TODO: enviar comando reserve-inventory
  }
}
