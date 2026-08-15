import { Injectable, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';
import { CreateOrderDto } from './create-order.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly brokerService: BrokerService) {}

  async create(dto: CreateOrderDto) {
    const orderId = randomUUID();
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    await this.brokerService.publish('order.exchange', 'order.created', {
      specversion: '1.0',
      id: orderId,
      source: 'order-api',
      type: 'order.created',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        orderId,
        customerId: dto.customerId,
        items: dto.items,
        payment: dto.payment,
        shipping: dto.shipping,
        totalAmount,
      },
    });

    this.logger.log(`Order created: ${orderId}`);
    return { orderId, status: 'created' };
  }
}
