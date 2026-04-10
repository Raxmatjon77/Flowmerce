import { Module } from '@nestjs/common';
import { OrderModule } from '@order/order.module';
import { InventoryModule } from '@inventory/inventory.module';
import { PaymentModule } from '@payment/payment.module';
import { ShippingModule } from '@shipping/shipping.module';
import { NotificationModule } from '@notification/notification.module';
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
    OrderModule,
    InventoryModule,
    PaymentModule,
    ShippingModule,
    NotificationModule,
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
