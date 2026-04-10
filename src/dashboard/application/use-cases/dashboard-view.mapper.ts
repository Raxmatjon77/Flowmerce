import {
  DashboardActivityDto,
  DashboardHealthResponseDto,
  DashboardHealthServiceDto,
  DashboardInventoryAlertDto,
  DashboardInventoryListItemDto,
  DashboardNotificationListItemDto,
  DashboardPaymentListItemDto,
  DashboardRecentOrderDto,
  DashboardShipmentListItemDto,
  DashboardStatusCountDto,
  DashboardTrendPointDto,
} from '../dtos/dashboard-response.dto';
import {
  DashboardDependencyHealth,
} from '../ports/dashboard-health.port';
import {
  DashboardInventoryRecord,
  DashboardNotificationRecord,
  DashboardOrderItemRecord,
  DashboardOrderRecord,
  DashboardPaymentRecord,
  DashboardShipmentRecord,
} from '../ports/dashboard-read.port';

export function toDashboardHealthResponse(
  services: DashboardDependencyHealth[],
): DashboardHealthResponseDto {
  const overallStatus = services.some((service) => service.status === 'down')
    ? 'down'
    : services.some((service) => service.status === 'degraded')
      ? 'degraded'
      : 'healthy';

  return {
    overallStatus,
    services: services.map(
      (service): DashboardHealthServiceDto => ({
        name: service.name,
        status: service.status,
        responseTimeMs: service.responseTimeMs,
        details: service.details,
        checkedAt: service.checkedAt,
      }),
    ),
    generatedAt: new Date(),
  };
}

export function countByStatus(statuses: string[]): DashboardStatusCountDto[] {
  const counts = new Map<string, number>();

  for (const status of statuses) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

export function buildOrderTrend(
  orders: DashboardOrderRecord[],
  payments: DashboardPaymentRecord[],
): DashboardTrendPointDto[] {
  const days = 7;
  const points: DashboardTrendPointDto[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) =>
      order.created_at.toISOString().startsWith(key),
    );
    const orderIds = new Set(dayOrders.map((order) => order.id));
    const revenue = payments
      .filter(
        (payment) =>
          payment.status === 'COMPLETED' &&
          orderIds.has(payment.order_id) &&
          payment.created_at.toISOString().startsWith(key),
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    points.push({
      date: key,
      orders: dayOrders.length,
      revenue,
    });
  }

  return points;
}

export function buildActivityFeed(params: {
  orders: DashboardOrderRecord[];
  payments: DashboardPaymentRecord[];
  shipments: DashboardShipmentRecord[];
  notifications: DashboardNotificationRecord[];
  limit: number;
}): DashboardActivityDto[] {
  const activities: DashboardActivityDto[] = [
    ...params.orders.map((order) => ({
      type: 'order',
      entityId: order.id,
      title: `Order ${order.id}`,
      description: `Customer ${order.customer_id} is currently ${order.status}`,
      status: order.status,
      timestamp: order.created_at,
    })),
    ...params.payments.map((payment) => ({
      type: 'payment',
      entityId: payment.id,
      title: `Payment ${payment.id}`,
      description: `Order ${payment.order_id} payment is ${payment.status}`,
      status: payment.status,
      timestamp: payment.created_at,
    })),
    ...params.shipments.map((shipment) => ({
      type: 'shipment',
      entityId: shipment.id,
      title: `Shipment ${shipment.id}`,
      description: `Order ${shipment.order_id} shipment is ${shipment.status}`,
      status: shipment.status,
      timestamp: shipment.created_at,
    })),
    ...params.notifications.map((notification) => ({
      type: 'notification',
      entityId: notification.id,
      title: `Notification ${notification.id}`,
      description: `${notification.type} for ${notification.recipient_id}`,
      status: notification.status,
      timestamp: notification.created_at,
    })),
  ];

  return activities
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
    .slice(0, params.limit);
}

export function toRecentOrderDto(
  order: DashboardOrderRecord,
  orderItems: DashboardOrderItemRecord[],
): DashboardRecentOrderDto {
  return {
    id: order.id,
    customerId: order.customer_id,
    status: order.status,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    itemCount: orderItems.filter((item) => item.order_id === order.id).length,
    createdAt: order.created_at,
  };
}

export function toInventoryAlertDto(
  item: DashboardInventoryRecord,
): DashboardInventoryAlertDto {
  const totalQuantity = Number(item.total_quantity);
  const reservedQuantity = Number(item.reserved_quantity);

  return {
    id: item.id,
    sku: item.sku,
    productName: item.product_name,
    availableQuantity: totalQuantity - reservedQuantity,
    totalQuantity,
    reservedQuantity,
    lowStockThreshold: lowStockThreshold(totalQuantity),
  };
}

export function toInventoryListItemDto(
  item: DashboardInventoryRecord,
): DashboardInventoryListItemDto {
  const totalQuantity = Number(item.total_quantity);
  const reservedQuantity = Number(item.reserved_quantity);
  const availableQuantity = totalQuantity - reservedQuantity;
  const threshold = lowStockThreshold(totalQuantity);

  return {
    id: item.id,
    sku: item.sku,
    productName: item.product_name,
    totalQuantity,
    reservedQuantity,
    availableQuantity,
    lowStockThreshold: threshold,
    stockState:
      availableQuantity <= Math.max(5, Math.floor(threshold / 2))
        ? 'critical'
        : availableQuantity <= threshold
          ? 'low'
          : 'healthy',
  };
}

export function toPaymentListItemDto(
  payment: DashboardPaymentRecord,
): DashboardPaymentListItemDto {
  return {
    id: payment.id,
    orderId: payment.order_id,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    method: formatPaymentMethod(payment.method_type, payment.method_last4),
    transactionId: payment.transaction_id,
    failureReason: payment.failure_reason,
    createdAt: payment.created_at,
  };
}

export function toShipmentListItemDto(
  shipment: DashboardShipmentRecord,
): DashboardShipmentListItemDto {
  return {
    id: shipment.id,
    orderId: shipment.order_id,
    status: shipment.status,
    trackingNumber: shipment.tracking_number,
    carrierName: shipment.carrier_name,
    estimatedDelivery: shipment.estimated_delivery,
    shippingAddress: formatAddress({
      street: shipment.shipping_street,
      city: shipment.shipping_city,
      state: shipment.shipping_state,
      zipCode: shipment.shipping_zip,
      country: shipment.shipping_country,
    }),
    createdAt: shipment.created_at,
  };
}

export function toNotificationListItemDto(
  notification: DashboardNotificationRecord,
): DashboardNotificationListItemDto {
  return {
    id: notification.id,
    recipientId: notification.recipient_id,
    channel: notification.channel,
    type: notification.type,
    status: notification.status,
    subject: notification.subject,
    body: notification.body,
    failureReason: notification.failure_reason,
    createdAt: notification.created_at,
  };
}

export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): string {
  return [
    address.street,
    `${address.city}, ${address.state} ${address.zipCode}`.trim(),
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatPaymentMethod(
  methodType: string,
  last4: string | null,
): string {
  return last4
    ? `${methodType.toUpperCase()} •••• ${last4}`
    : methodType.toUpperCase();
}

export function lowStockThreshold(totalQuantity: number): number {
  return Math.max(5, Math.floor(Number(totalQuantity) * 0.2));
}

export function isLowStock(
  totalQuantity: number,
  reservedQuantity: number,
): boolean {
  const availableQuantity = Number(totalQuantity) - Number(reservedQuantity);
  return availableQuantity <= lowStockThreshold(Number(totalQuantity));
}
