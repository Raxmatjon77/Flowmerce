export interface OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface OrderShippingAddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderResponseDto {
  id: string;
  customerId: string;
  status: string;
  items: OrderItemResponseDto[];
  totalAmount: number;
  currency: string;
  shippingAddress: OrderShippingAddressDto;
  createdAt: Date;
}
