import { Order } from '@order/domain';
import {
  OrderResponseDto,
  OrderItemResponseDto,
  OrderShippingAddressDto,
} from '../dtos/order-response.dto';

export function toOrderResponseDto(order: Order): OrderResponseDto {
  const items: OrderItemResponseDto[] = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice.amount,
    totalPrice: item.totalPrice.amount,
    currency: item.unitPrice.currency,
  }));

  const shippingAddress: OrderShippingAddressDto = {
    street: order.shippingAddress.street,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    zipCode: order.shippingAddress.zipCode,
    country: order.shippingAddress.country,
  };

  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status.toString(),
    items,
    totalAmount: order.totalAmount.amount,
    currency: order.totalAmount.currency,
    shippingAddress,
    createdAt: order.createdAt,
  };
}
