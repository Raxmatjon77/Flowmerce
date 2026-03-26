export interface CreateOrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface CreateOrderShippingAddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateOrderDto {
  customerId: string;
  items: CreateOrderItemDto[];
  shippingAddress: CreateOrderShippingAddressDto;
}
