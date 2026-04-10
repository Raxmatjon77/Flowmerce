// Value Objects
export { Money } from './value-objects/money.value-object';
export { ShippingAddress } from './value-objects/shipping-address.value-object';
export { OrderStatus, OrderStatusEnum } from './value-objects/order-status.value-object';

// Entities
export { OrderItem, type OrderItemProps } from './entities/order-item.entity';
export { Order, type OrderProps } from './entities/order.entity';

// Events
export { OrderCreatedEvent } from './events/order-created.event';
export { OrderInventoryReservedEvent } from './events/order-inventory-reserved.event';
export { OrderPaymentProcessedEvent } from './events/order-payment-processed.event';
export { OrderConfirmedEvent } from './events/order-confirmed.event';
export { OrderCancelledEvent } from './events/order-cancelled.event';
export { OrderShippedEvent } from './events/order-shipped.event';

// Repository Interface
export { IOrderRepository, ORDER_REPOSITORY } from './repositories/order.repository.interface';

// Errors
export {
  InvalidOrderTransitionError,
  OrderNotFoundError,
  InvalidOrderError,
  OrderWorkflowNotFoundError,
} from './errors/order-domain.errors';
