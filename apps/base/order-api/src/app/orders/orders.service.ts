import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './create-order.dto';
import { BrokerService } from '../broker/broker.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly brokerService: BrokerService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = this.ordersRepository.create({
      customerId: dto.customerId,
      items: dto.items,
      payment: dto.payment,
      shipping: dto.shipping,
      totalAmount,
      status: 'created',
    });

    const saved = await this.ordersRepository.save(order);

    await this.brokerService.publish('order.events', 'order.created', {
      specversion: '1.0',
      id: saved.id,
      source: 'order-api',
      type: 'order.created',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        orderId: saved.id,
        customerId: saved.customerId,
        items: saved.items,
        payment: saved.payment,
        shipping: saved.shipping,
        totalAmount: saved.totalAmount,
      },
    });

    return saved;
  }
}
