interface ItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentDto {
  method: string;
  cardLastFour: string;
}

interface ShippingDto {
  address: string;
  city: string;
  zipCode: string;
}

export class CreateOrderDto {
  customerId: string;
  items: ItemDto[];
  payment: PaymentDto;
  shipping: ShippingDto;
}
