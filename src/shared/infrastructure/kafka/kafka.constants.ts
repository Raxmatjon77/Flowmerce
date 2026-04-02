export const KAFKA_CLIENT = Symbol('KAFKA_CLIENT');

// --- Kafka Topics ---
export const KAFKA_TOPICS = {
  ORDER_EVENTS: 'order.events',
  PAYMENT_EVENTS: 'payment.events',
  INVENTORY_EVENTS: 'inventory.events',
  SHIPPING_EVENTS: 'shipping.events',
  NOTIFICATION_EVENTS: 'notification.events',
} as const;

export const dlqTopic = (topic: string) => `${topic}.dlq` as const;

// --- Consumer Group IDs ---
export const CONSUMER_GROUPS = {
  // Order service consumers
  ORDER_PAYMENT: 'order-service-payment-consumer',
  ORDER_INVENTORY: 'order-service-inventory-consumer',
  ORDER_SHIPPING: 'order-service-shipping-consumer',
  // Payment service consumers
  PAYMENT_ORDER: 'payment-service-order-consumer',
  // Inventory service consumers
  INVENTORY_ORDER: 'inventory-service-order-consumer',
  // Shipping service consumers
  SHIPPING_ORDER: 'shipping-service-order-consumer',
  // Notification service consumers
  NOTIFICATION_ORDER: 'notification-service-order-consumer',
  NOTIFICATION_PAYMENT: 'notification-service-payment-consumer',
  NOTIFICATION_SHIPPING: 'notification-service-shipping-consumer',
  NOTIFICATION_INVENTORY: 'notification-service-inventory-consumer',
} as const;

// --- Event Types ---
export enum OrderEventType {
  CREATED = 'OrderCreated',
  INVENTORY_RESERVED = 'OrderInventoryReserved',
  PAYMENT_PROCESSED = 'OrderPaymentProcessed',
  CONFIRMED = 'OrderConfirmed',
  CANCELLED = 'OrderCancelled',
  SHIPPED = 'OrderShipped',
}

export enum PaymentEventType {
  CREATED = 'PaymentCreated',
  PROCESSED = 'PaymentProcessed',
  FAILED = 'PaymentFailed',
  REFUNDED = 'PaymentRefunded',
}

export enum InventoryEventType {
  RESERVED = 'inventory.reserved',
  RELEASED = 'inventory.released',
  DEDUCTED = 'inventory.deducted',
}

export enum ShippingEventType {
  CREATED = 'shipment.created',
  DELIVERED = 'shipment.delivered',
}

export enum NotificationEventType {
  SENT = 'NotificationSent',
}

// --- Idempotency Key Prefixes ---
export const IDEMPOTENCY_PREFIXES = {
  ORDER_CONSUMER: 'order-consumer',
  PAYMENT_CONSUMER: 'payment-consumer',
  INVENTORY_CONSUMER: 'inventory-consumer',
  SHIPPING_CONSUMER: 'shipping-consumer',
  NOTIFICATION_CONSUMER: 'notification-consumer',
} as const;

// --- Default Consumer Config ---
export const DEFAULT_MAX_RETRIES = 3;
