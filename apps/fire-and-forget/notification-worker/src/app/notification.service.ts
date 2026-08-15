import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    // Binding explícito (exchange/queue/routingKey) para fins didáticos do estudo de EDA
    await this.brokerService.subscribe(
      'fire-and-forget.payment.exchange',
      'fire-and-forget.payment.processed.queue',
      'payment.processed',
      (event) => this.handlePaymentProcessed(event),
    );
  }

  private async handlePaymentProcessed(event: any) {
    const { orderId } = event.data;
    this.logger.log(`Sending notification for order ${orderId}`);

    // Simula envio de notificação
    this.logger.log(`  Email sent to customer for order ${orderId}`);
  }
}
