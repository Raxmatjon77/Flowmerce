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
import { DASHBOARD_USE_CASE_TOKENS } from './application/injection-tokens';
import {
  DASHBOARD_HEALTH_PORT,
  IDashboardHealthPort,
} from './application/ports/dashboard-health.port';
import {
  DASHBOARD_READ_PORT,
  IDashboardReadPort,
} from './application/ports/dashboard-read.port';
import { ListDashboardActivityUseCase } from './application/use-cases/list-dashboard-activity/list-dashboard-activity.use-case';
import { GetDashboardHealthUseCase } from './application/use-cases/get-dashboard-health/get-dashboard-health.use-case';
import { ListDashboardInventoryUseCase } from './application/use-cases/list-dashboard-inventory/list-dashboard-inventory.use-case';
import { ListDashboardNotificationsUseCase } from './application/use-cases/list-dashboard-notifications/list-dashboard-notifications.use-case';
import { GetDashboardOrderDetailUseCase } from './application/use-cases/get-dashboard-order-detail/get-dashboard-order-detail.use-case';
import { GetDashboardOverviewUseCase } from './application/use-cases/get-dashboard-overview/get-dashboard-overview.use-case';
import { ListDashboardOrdersUseCase } from './application/use-cases/list-dashboard-orders/list-dashboard-orders.use-case';
import { ListDashboardPaymentsUseCase } from './application/use-cases/list-dashboard-payments/list-dashboard-payments.use-case';
import { ListDashboardShipmentsUseCase } from './application/use-cases/list-dashboard-shipments/list-dashboard-shipments.use-case';
import { DashboardHealthAdapter } from './infrastructure/adapters/dashboard-health.adapter';
import { KyselyDashboardReadAdapter } from './infrastructure/adapters/kysely-dashboard-read.adapter';
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
    { provide: DASHBOARD_READ_PORT, useClass: KyselyDashboardReadAdapter },
    { provide: DASHBOARD_HEALTH_PORT, useClass: DashboardHealthAdapter },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.GET_OVERVIEW,
      useFactory: (
        dashboardReadPort: IDashboardReadPort,
        dashboardHealthPort: IDashboardHealthPort,
      ) =>
        new GetDashboardOverviewUseCase(
          dashboardReadPort,
          dashboardHealthPort,
        ),
      inject: [DASHBOARD_READ_PORT, DASHBOARD_HEALTH_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_ORDERS,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardOrdersUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.GET_ORDER_DETAIL,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new GetDashboardOrderDetailUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_INVENTORY,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardInventoryUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_PAYMENTS,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardPaymentsUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_SHIPMENTS,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardShipmentsUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_NOTIFICATIONS,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardNotificationsUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.GET_HEALTH,
      useFactory: (dashboardHealthPort: IDashboardHealthPort) =>
        new GetDashboardHealthUseCase(dashboardHealthPort),
      inject: [DASHBOARD_HEALTH_PORT],
    },
    {
      provide: DASHBOARD_USE_CASE_TOKENS.LIST_ACTIVITY,
      useFactory: (dashboardReadPort: IDashboardReadPort) =>
        new ListDashboardActivityUseCase(dashboardReadPort),
      inject: [DASHBOARD_READ_PORT],
    },
    DatabaseHealthIndicator,
    KafkaHealthIndicator,
    TemporalHealthIndicator,
  ],
})
export class DashboardModule {}
