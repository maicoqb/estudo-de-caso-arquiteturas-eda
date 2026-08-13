import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
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

    return this.ordersRepository.save(order);
  }
}
