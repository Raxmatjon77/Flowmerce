import { Module } from '@nestjs/common';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
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
import { DatabaseHealthIndicator } from '../health/infrastructure/indicators/database.health';
import { KafkaHealthIndicator } from '../health/infrastructure/indicators/kafka.health';
import { TemporalHealthIndicator } from '../health/infrastructure/indicators/temporal.health';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  imports: [
    KyselyModule.forFeature<OrderDatabase>({
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432', 10),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
      token: KYSELY_ORDER_DB,
    }),
    KyselyModule.forFeature<InventoryDatabase>({
      host: process.env.INVENTORY_DB_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_DB_PORT || '5434', 10),
      user: process.env.INVENTORY_DB_USER || 'inventory_user',
      password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_DB_NAME || 'inventory_db',
      token: KYSELY_INVENTORY_DB,
    }),
    KyselyModule.forFeature<PaymentDatabase>({
      host: process.env.PAYMENT_DB_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_DB_PORT || '5433', 10),
      user: process.env.PAYMENT_DB_USER || 'payment_user',
      password: process.env.PAYMENT_DB_PASSWORD || 'payment_pass',
      database: process.env.PAYMENT_DB_NAME || 'payment_db',
      token: KYSELY_PAYMENT_DB,
    }),
    KyselyModule.forFeature<ShippingDatabase>({
      host: process.env.SHIPPING_DB_HOST || 'localhost',
      port: parseInt(process.env.SHIPPING_DB_PORT || '5435', 10),
      user: process.env.SHIPPING_DB_USER || 'shipping_user',
      password: process.env.SHIPPING_DB_PASSWORD || 'shipping_pass',
      database: process.env.SHIPPING_DB_NAME || 'shipping_db',
      token: KYSELY_SHIPPING_DB,
    }),
    KyselyModule.forFeature<NotificationDatabase>({
      host: process.env.NOTIFICATION_DB_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_DB_PORT || '5436', 10),
      user: process.env.NOTIFICATION_DB_USER || 'notification_user',
      password: process.env.NOTIFICATION_DB_PASSWORD || 'notification_pass',
      database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
      token: KYSELY_NOTIFICATION_DB,
    }),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DatabaseHealthIndicator,
    KafkaHealthIndicator,
    TemporalHealthIndicator,
  ],
})
export class DashboardModule {}
