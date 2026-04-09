import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { HealthCheckError } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from '../../health/infrastructure/indicators/database.health';
import { KafkaHealthIndicator } from '../../health/infrastructure/indicators/kafka.health';
import { TemporalHealthIndicator } from '../../health/infrastructure/indicators/temporal.health';
import { OrderDatabase } from '@order/infrastructure/database/tables/order.table';
import { KYSELY_ORDER_DB } from '@order/infrastructure/database/repositories/order.repository';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from '@inventory/infrastructure/database/tables/inventory.table';
import {
  PaymentDatabase,
} from '@payment/infrastructure/database/tables/payment.table';
import { KYSELY_PAYMENT_DB } from '@payment/infrastructure/database/repositories/payment.repository';
import {
  ShippingDatabase,
  KYSELY_SHIPPING_DB,
} from '@shipping/infrastructure/database/tables/shipping.table';
import {
  NotificationDatabase,
  KYSELY_NOTIFICATION_DB,
} from '@notification/infrastructure/database/tables/notification.table';
import {
  DashboardActivityDto,
  DashboardActivityResponseDto,
  DashboardHealthResponseDto,
  DashboardHealthServiceDto,
  DashboardInventoryAlertDto,
  DashboardInventoryListItemDto,
  DashboardInventoryListResponseDto,
  DashboardNotificationListItemDto,
  DashboardNotificationListResponseDto,
  DashboardOrderDetailDto,
  DashboardOrderListItemDto,
  DashboardOrderListResponseDto,
  DashboardOverviewResponseDto,
  DashboardPaymentListItemDto,
  DashboardPaymentListResponseDto,
  DashboardRecentOrderDto,
  DashboardShipmentListItemDto,
  DashboardShipmentListResponseDto,
  DashboardStatusCountDto,
  DashboardTrendPointDto,
} from './dtos/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(KYSELY_ORDER_DB)
    private readonly orderDb: Kysely<OrderDatabase>,
    @Inject(KYSELY_INVENTORY_DB)
    private readonly inventoryDb: Kysely<InventoryDatabase>,
    @Inject(KYSELY_PAYMENT_DB)
    private readonly paymentDb: Kysely<PaymentDatabase>,
    @Inject(KYSELY_SHIPPING_DB)
    private readonly shippingDb: Kysely<ShippingDatabase>,
    @Inject(KYSELY_NOTIFICATION_DB)
    private readonly notificationDb: Kysely<NotificationDatabase>,
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly kafkaHealth: KafkaHealthIndicator,
    private readonly temporalHealth: TemporalHealthIndicator,
  ) {}

  async getOverview(limit = 10): Promise<DashboardOverviewResponseDto> {
    const [
      orders,
      orderItems,
      inventoryItems,
      payments,
      shipments,
      notifications,
      health,
    ] = await Promise.all([
      this.orderDb.selectFrom('orders').selectAll().execute(),
      this.orderDb.selectFrom('order_items').selectAll().execute(),
      this.inventoryDb.selectFrom('inventory_items').selectAll().execute(),
      this.paymentDb.selectFrom('payments').selectAll().execute(),
      this.shippingDb.selectFrom('shipments').selectAll().execute(),
      this.notificationDb.selectFrom('notifications').selectAll().execute(),
      this.getHealth(),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const activeOrders = orders.filter(
      (order) => !['SHIPPED', 'CANCELLED'].includes(order.status),
    ).length;
    const unhealthyServices = health.services.filter(
      (service) => service.status !== 'healthy',
    ).length;
    const recentOrders = orders
      .slice()
      .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
      .slice(0, limit)
      .map((order) => this.toRecentOrderDto(order, orderItems));

    return {
      summary: {
        totalOrders: orders.length,
        ordersToday: orders.filter((order) =>
          order.created_at.toISOString().startsWith(todayKey),
        ).length,
        activeOrders,
        totalRevenue: payments
          .filter((payment) => payment.status === 'COMPLETED')
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
        totalInventoryUnits: inventoryItems.reduce(
          (sum, item) => sum + Number(item.total_quantity),
          0,
        ),
        lowStockItems: inventoryItems.filter((item) =>
          this.isLowStock(item.total_quantity, item.reserved_quantity),
        ).length,
        pendingNotifications: notifications.filter(
          (notification) => notification.status === 'PENDING',
        ).length,
        unhealthyServices,
      },
      orderStatusDistribution: this.countByStatus(orders.map((order) => order.status)),
      paymentStatusDistribution: this.countByStatus(
        payments.map((payment) => payment.status),
      ),
      shipmentStatusDistribution: this.countByStatus(
        shipments.map((shipment) => shipment.status),
      ),
      notificationStatusDistribution: this.countByStatus(
        notifications.map((notification) => notification.status),
      ),
      orderTrend: this.buildOrderTrend(orders, payments),
      lowStockItems: inventoryItems
        .filter((item) => this.isLowStock(item.total_quantity, item.reserved_quantity))
        .slice(0, 5)
        .map((item) => this.toInventoryAlertDto(item)),
      recentOrders,
      recentActivity: this.buildActivityFeed({
        orders,
        payments,
        shipments,
        notifications,
        limit,
      }),
      health,
      generatedAt: new Date(),
    };
  }

  async listOrders(filters: {
    q?: string;
    status?: string;
    limit?: number;
  }): Promise<DashboardOrderListResponseDto> {
    const orders = await this.orderDb.selectFrom('orders').selectAll().execute();
    const orderItems = await this.orderDb.selectFrom('order_items').selectAll().execute();
    const normalizedQuery = filters.q?.toLowerCase();
    const filtered = orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.id.toLowerCase().includes(normalizedQuery) ||
        order.customer_id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !filters.status || order.status === filters.status;
      return matchesQuery && matchesStatus;
    });
    const sorted = filtered.sort(
      (left, right) => right.created_at.getTime() - left.created_at.getTime(),
    );
    const limit = filters.limit ?? 50;

    return {
      data: sorted.slice(0, limit).map((order): DashboardOrderListItemDto => ({
        id: order.id,
        customerId: order.customer_id,
        status: order.status,
        totalAmount: Number(order.total_amount),
        currency: order.currency,
        itemCount: orderItems.filter((item) => item.order_id === order.id).length,
        shippingAddress: this.formatAddress({
          street: order.shipping_street,
          city: order.shipping_city,
          state: order.shipping_state,
          zipCode: order.shipping_zip_code,
          country: order.shipping_country,
        }),
        createdAt: order.created_at,
      })),
      meta: {
        total: filtered.length,
        limit,
      },
    };
  }

  async getOrderDetail(orderId: string): Promise<DashboardOrderDetailDto> {
    const order = await this.orderDb
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', orderId)
      .executeTakeFirst();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const [items, payment, shipment] = await Promise.all([
      this.orderDb
        .selectFrom('order_items')
        .selectAll()
        .where('order_id', '=', orderId)
        .execute(),
      this.paymentDb
        .selectFrom('payments')
        .selectAll()
        .where('order_id', '=', orderId)
        .executeTakeFirst(),
      this.shippingDb
        .selectFrom('shipments')
        .selectAll()
        .where('order_id', '=', orderId)
        .executeTakeFirst(),
    ]);

    return {
      id: order.id,
      customerId: order.customer_id,
      status: order.status,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      shippingAddress: this.formatAddress({
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zipCode: order.shipping_zip_code,
        country: order.shipping_country,
      }),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        currency: item.currency,
        totalPrice: Number(item.unit_price) * item.quantity,
      })),
      payment: payment
        ? {
            id: payment.id,
            orderId: payment.order_id,
            amount: Number(payment.amount),
            currency: payment.currency,
            status: payment.status,
            method: this.formatPaymentMethod(payment.method_type, payment.method_last4),
            transactionId: payment.transaction_id,
            failureReason: payment.failure_reason,
            createdAt: payment.created_at,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment.id,
            orderId: shipment.order_id,
            status: shipment.status,
            trackingNumber: shipment.tracking_number,
            carrierName: shipment.carrier_name,
            estimatedDelivery: shipment.estimated_delivery,
            createdAt: shipment.created_at,
          }
        : null,
    };
  }

  async listInventory(filters: {
    q?: string;
    lowStockOnly?: boolean;
    limit?: number;
  }): Promise<DashboardInventoryListResponseDto> {
    const inventoryItems = await this.inventoryDb
      .selectFrom('inventory_items')
      .selectAll()
      .execute();

    const normalizedQuery = filters.q?.toLowerCase();
    const filtered = inventoryItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.sku.toLowerCase().includes(normalizedQuery) ||
        item.product_name.toLowerCase().includes(normalizedQuery);
      const matchesLowStock =
        !filters.lowStockOnly ||
        this.isLowStock(item.total_quantity, item.reserved_quantity);
      return matchesQuery && matchesLowStock;
    });
    const limit = filters.limit ?? 100;

    return {
      data: filtered.slice(0, limit).map((item): DashboardInventoryListItemDto => {
        const availableQuantity =
          Number(item.total_quantity) - Number(item.reserved_quantity);
        const lowStockThreshold = this.lowStockThreshold(item.total_quantity);
        return {
          id: item.id,
          sku: item.sku,
          productName: item.product_name,
          totalQuantity: Number(item.total_quantity),
          reservedQuantity: Number(item.reserved_quantity),
          availableQuantity,
          lowStockThreshold,
          stockState:
            availableQuantity <= Math.max(5, Math.floor(lowStockThreshold / 2))
              ? 'critical'
              : availableQuantity <= lowStockThreshold
                ? 'low'
                : 'healthy',
        };
      }),
      meta: {
        total: filtered.length,
        limit,
      },
    };
  }

  async listPayments(filters: {
    q?: string;
    status?: string;
    limit?: number;
  }): Promise<DashboardPaymentListResponseDto> {
    const payments = await this.paymentDb.selectFrom('payments').selectAll().execute();
    const normalizedQuery = filters.q?.toLowerCase();
    const filtered = payments.filter((payment) => {
      const matchesQuery =
        !normalizedQuery ||
        payment.id.toLowerCase().includes(normalizedQuery) ||
        payment.order_id.toLowerCase().includes(normalizedQuery) ||
        payment.method_type.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !filters.status || payment.status === filters.status;
      return matchesQuery && matchesStatus;
    });
    const sorted = filtered.sort(
      (left, right) => right.created_at.getTime() - left.created_at.getTime(),
    );
    const limit = filters.limit ?? 100;

    return {
      data: sorted.slice(0, limit).map((payment): DashboardPaymentListItemDto => ({
        id: payment.id,
        orderId: payment.order_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        method: this.formatPaymentMethod(payment.method_type, payment.method_last4),
        transactionId: payment.transaction_id,
        failureReason: payment.failure_reason,
        createdAt: payment.created_at,
      })),
      meta: {
        total: filtered.length,
        limit,
      },
    };
  }

  async listShipments(filters: {
    q?: string;
    status?: string;
    limit?: number;
  }): Promise<DashboardShipmentListResponseDto> {
    const shipments = await this.shippingDb.selectFrom('shipments').selectAll().execute();
    const normalizedQuery = filters.q?.toLowerCase();
    const filtered = shipments.filter((shipment) => {
      const matchesQuery =
        !normalizedQuery ||
        shipment.id.toLowerCase().includes(normalizedQuery) ||
        shipment.order_id.toLowerCase().includes(normalizedQuery) ||
        (shipment.tracking_number || '').toLowerCase().includes(normalizedQuery) ||
        (shipment.carrier_name || '').toLowerCase().includes(normalizedQuery);
      const matchesStatus = !filters.status || shipment.status === filters.status;
      return matchesQuery && matchesStatus;
    });
    const sorted = filtered.sort(
      (left, right) => right.created_at.getTime() - left.created_at.getTime(),
    );
    const limit = filters.limit ?? 100;

    return {
      data: sorted.slice(0, limit).map((shipment): DashboardShipmentListItemDto => ({
        id: shipment.id,
        orderId: shipment.order_id,
        status: shipment.status,
        trackingNumber: shipment.tracking_number,
        carrierName: shipment.carrier_name,
        estimatedDelivery: shipment.estimated_delivery,
        shippingAddress: this.formatAddress({
          street: shipment.shipping_street,
          city: shipment.shipping_city,
          state: shipment.shipping_state,
          zipCode: shipment.shipping_zip,
          country: shipment.shipping_country,
        }),
        createdAt: shipment.created_at,
      })),
      meta: {
        total: filtered.length,
        limit,
      },
    };
  }

  async listNotifications(filters: {
    q?: string;
    status?: string;
    channel?: string;
    limit?: number;
  }): Promise<DashboardNotificationListResponseDto> {
    const notifications = await this.notificationDb
      .selectFrom('notifications')
      .selectAll()
      .execute();
    const normalizedQuery = filters.q?.toLowerCase();
    const filtered = notifications.filter((notification) => {
      const matchesQuery =
        !normalizedQuery ||
        notification.recipient_id.toLowerCase().includes(normalizedQuery) ||
        notification.subject.toLowerCase().includes(normalizedQuery) ||
        notification.body.toLowerCase().includes(normalizedQuery) ||
        notification.type.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !filters.status || notification.status === filters.status;
      const matchesChannel =
        !filters.channel || notification.channel === filters.channel;
      return matchesQuery && matchesStatus && matchesChannel;
    });
    const sorted = filtered.sort(
      (left, right) => right.created_at.getTime() - left.created_at.getTime(),
    );
    const limit = filters.limit ?? 100;

    return {
      data: sorted
        .slice(0, limit)
        .map((notification): DashboardNotificationListItemDto => ({
          id: notification.id,
          recipientId: notification.recipient_id,
          channel: notification.channel,
          type: notification.type,
          status: notification.status,
          subject: notification.subject,
          body: notification.body,
          failureReason: notification.failure_reason,
          createdAt: notification.created_at,
        })),
      meta: {
        total: filtered.length,
        limit,
      },
    };
  }

  async getHealth(): Promise<DashboardHealthResponseDto> {
    const services = await Promise.all([
      this.measureHealth('Order Database', () =>
        this.databaseHealth.isHealthy('database_order'),
      ),
      this.measureHealth('Kafka', () => this.kafkaHealth.isHealthy('kafka')),
      this.measureHealth('Temporal', () => this.temporalHealth.isHealthy('temporal')),
    ]);

    const overallStatus = services.some((service) => service.status === 'down')
      ? 'down'
      : services.some((service) => service.status === 'degraded')
        ? 'degraded'
        : 'healthy';

    return {
      overallStatus,
      services,
      generatedAt: new Date(),
    };
  }

  async listActivity(limit = 20): Promise<DashboardActivityResponseDto> {
    const [orders, payments, shipments, notifications] = await Promise.all([
      this.orderDb.selectFrom('orders').selectAll().execute(),
      this.paymentDb.selectFrom('payments').selectAll().execute(),
      this.shippingDb.selectFrom('shipments').selectAll().execute(),
      this.notificationDb.selectFrom('notifications').selectAll().execute(),
    ]);

    return {
      data: this.buildActivityFeed({ orders, payments, shipments, notifications, limit }),
      meta: {
        total:
          orders.length + payments.length + shipments.length + notifications.length,
        limit,
      },
    };
  }

  private async measureHealth(
    name: string,
    check: () => Promise<Record<string, unknown>>,
  ): Promise<DashboardHealthServiceDto> {
    const checkedAt = new Date();

    try {
      const result = await check();
      const detail = Object.values(result)[0] as Record<string, unknown> | undefined;
      return {
        name,
        status: 'healthy',
        responseTimeMs: this.parseResponseTime(detail?.responseTime),
        details: detail ? JSON.stringify(detail) : 'Healthy',
        checkedAt,
      };
    } catch (error) {
      const detail = this.extractHealthError(error);
      return {
        name,
        status: name === 'Temporal' ? 'degraded' : 'down',
        responseTimeMs: this.parseResponseTime(detail.responseTime),
        details: detail.message,
        checkedAt,
      };
    }
  }

  private extractHealthError(error: unknown): {
    message: string;
    responseTime?: unknown;
  } {
    if (error instanceof HealthCheckError) {
      const causes = Object.values(error.causes);
      const firstCause = causes[0] as Record<string, unknown> | undefined;
      return {
        message:
          typeof firstCause?.message === 'string'
            ? firstCause.message
            : error.message,
        responseTime: firstCause?.responseTime,
      };
    }

    if (error instanceof Error) {
      return { message: error.message };
    }

    return { message: 'Unknown health check error' };
  }

  private parseResponseTime(responseTime: unknown): number | null {
    if (typeof responseTime === 'string' && responseTime.endsWith('ms')) {
      const value = Number.parseInt(responseTime.replace('ms', ''), 10);
      return Number.isNaN(value) ? null : value;
    }
    return null;
  }

  private countByStatus(statuses: string[]): DashboardStatusCountDto[] {
    const counts = new Map<string, number>();
    for (const status of statuses) {
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }

  private buildOrderTrend(
    orders: Array<{ id: string; created_at: Date }>,
    payments: Array<{ order_id: string; amount: number; status: string; created_at: Date }>,
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
      const dayRevenue = payments
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
        revenue: dayRevenue,
      });
    }

    return points;
  }

  private buildActivityFeed(params: {
    orders: Array<{ id: string; customer_id: string; status: string; created_at: Date }>;
    payments: Array<{ id: string; order_id: string; status: string; created_at: Date }>;
    shipments: Array<{ id: string; order_id: string; status: string; created_at: Date }>;
    notifications: Array<{
      id: string;
      recipient_id: string;
      status: string;
      type: string;
      created_at: Date;
    }>;
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

  private toRecentOrderDto(
    order: {
      id: string;
      customer_id: string;
      status: string;
      total_amount: number;
      currency: string;
      created_at: Date;
    },
    orderItems: Array<{ order_id: string }>,
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

  private toInventoryAlertDto(item: {
    id: string;
    sku: string;
    product_name: string;
    total_quantity: number;
    reserved_quantity: number;
  }): DashboardInventoryAlertDto {
    const totalQuantity = Number(item.total_quantity);
    const reservedQuantity = Number(item.reserved_quantity);
    return {
      id: item.id,
      sku: item.sku,
      productName: item.product_name,
      availableQuantity: totalQuantity - reservedQuantity,
      totalQuantity,
      reservedQuantity,
      lowStockThreshold: this.lowStockThreshold(totalQuantity),
    };
  }

  private lowStockThreshold(totalQuantity: number): number {
    return Math.max(5, Math.floor(Number(totalQuantity) * 0.2));
  }

  private isLowStock(totalQuantity: number, reservedQuantity: number): boolean {
    const availableQuantity = Number(totalQuantity) - Number(reservedQuantity);
    return availableQuantity <= this.lowStockThreshold(Number(totalQuantity));
  }

  private formatAddress(address: {
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

  private formatPaymentMethod(methodType: string, last4: string | null): string {
    return last4 ? `${methodType.toUpperCase()} •••• ${last4}` : methodType.toUpperCase();
  }
}
