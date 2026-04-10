import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OrderDatabase } from '@order/infrastructure/database/tables/order.table';
import { KYSELY_ORDER_DB } from '@order/infrastructure/database/repositories/order.repository';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from '@inventory/infrastructure/database/tables/inventory.table';
import { PaymentDatabase } from '@payment/infrastructure/database/tables/payment.table';
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
  DashboardInventoryRecord,
  DashboardNotificationRecord,
  DashboardOrderItemRecord,
  DashboardOrderRecord,
  DashboardPaymentRecord,
  DashboardShipmentRecord,
  IDashboardReadPort,
} from '../../application/ports/dashboard-read.port';

@Injectable()
export class KyselyDashboardReadAdapter implements IDashboardReadPort {
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
  ) {}

  async getOrders(): Promise<DashboardOrderRecord[]> {
    return this.orderDb.selectFrom('orders').selectAll().execute();
  }

  async getOrderItems(): Promise<DashboardOrderItemRecord[]> {
    return this.orderDb.selectFrom('order_items').selectAll().execute();
  }

  async findOrderById(orderId: string): Promise<DashboardOrderRecord | null> {
    return (
      (await this.orderDb
        .selectFrom('orders')
        .selectAll()
        .where('id', '=', orderId)
        .executeTakeFirst()) ?? null
    );
  }

  async findOrderItemsByOrderId(
    orderId: string,
  ): Promise<DashboardOrderItemRecord[]> {
    return this.orderDb
      .selectFrom('order_items')
      .selectAll()
      .where('order_id', '=', orderId)
      .execute();
  }

  async getInventoryItems(): Promise<DashboardInventoryRecord[]> {
    return this.inventoryDb.selectFrom('inventory_items').selectAll().execute();
  }

  async getPayments(): Promise<DashboardPaymentRecord[]> {
    return this.paymentDb.selectFrom('payments').selectAll().execute();
  }

  async findPaymentByOrderId(
    orderId: string,
  ): Promise<DashboardPaymentRecord | null> {
    return (
      (await this.paymentDb
        .selectFrom('payments')
        .selectAll()
        .where('order_id', '=', orderId)
        .executeTakeFirst()) ?? null
    );
  }

  async getShipments(): Promise<DashboardShipmentRecord[]> {
    return this.shippingDb.selectFrom('shipments').selectAll().execute();
  }

  async findShipmentByOrderId(
    orderId: string,
  ): Promise<DashboardShipmentRecord | null> {
    return (
      (await this.shippingDb
        .selectFrom('shipments')
        .selectAll()
        .where('order_id', '=', orderId)
        .executeTakeFirst()) ?? null
    );
  }

  async getNotifications(): Promise<DashboardNotificationRecord[]> {
    return this.notificationDb.selectFrom('notifications').selectAll().execute();
  }
}
