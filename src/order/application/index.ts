// DTOs
export { CreateOrderDto, CreateOrderItemDto, CreateOrderShippingAddressDto } from './dtos/create-order.dto';
export { OrderResponseDto, OrderItemResponseDto, OrderShippingAddressDto } from './dtos/order-response.dto';

// Use Cases
export { CreateOrderUseCase } from './use-cases/create-order/create-order.use-case';
export { GetOrderUseCase, GetOrderInput } from './use-cases/get-order/get-order.use-case';
export { ConfirmOrderUseCase, ConfirmOrderInput } from './use-cases/confirm-order/confirm-order.use-case';
export { CancelOrderUseCase, CancelOrderInput } from './use-cases/cancel-order/cancel-order.use-case';
export { UpdateOrderStatusUseCase, UpdateOrderStatusInput, UpdateOrderStatusOutput } from './use-cases/update-order-status/update-order-status.use-case';

// Mapper
export { toOrderResponseDto } from './use-cases/order-response.mapper';

// Ports
export {
  IInventoryServicePort,
  INVENTORY_SERVICE_PORT,
  InventoryReservationItem,
} from './ports/inventory-service.port';
export {
  IPaymentServicePort,
  PAYMENT_SERVICE_PORT,
  PaymentResult,
} from './ports/payment-service.port';
export {
  IShippingServicePort,
  SHIPPING_SERVICE_PORT,
  ShipmentResult,
  ShippingAddress as ShippingAddressPort,
} from './ports/shipping-service.port';
export {
  INotificationServicePort,
  NOTIFICATION_SERVICE_PORT,
  NotificationType,
} from './ports/notification-service.port';
