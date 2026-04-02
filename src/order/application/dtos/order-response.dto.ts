export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export class OrderShippingAddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class OrderResponseDto {
  id: string;
  customerId: string;
  status: string;
  items: OrderItemResponseDto[];
  totalAmount: number;
  currency: string;
  shippingAddress: OrderShippingAddressDto;
  createdAt: Date;
}
