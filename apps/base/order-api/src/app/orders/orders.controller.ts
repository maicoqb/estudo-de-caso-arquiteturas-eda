import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    return { orderId: order.id, status: order.status };
  }
}
