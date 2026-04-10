import { IUseCase } from '@shared/application';
import { DashboardOverviewResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardHealthPort } from '../../ports/dashboard-health.port';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import {
  buildActivityFeed,
  buildOrderTrend,
  countByStatus,
  isLowStock,
  toDashboardHealthResponse,
  toInventoryAlertDto,
  toRecentOrderDto,
} from '../dashboard-view.mapper';
import { ServiceHealthStatus } from '../../enums/dashboard.enums';
import { OrderStatusEnum } from '@order/domain';
import { PaymentStatusEnum } from '@payment/domain';
import { NotificationStatus } from '@notification/domain';

export interface GetDashboardOverviewInput {
  limit: number;
}

export class GetDashboardOverviewUseCase
  implements IUseCase<GetDashboardOverviewInput, DashboardOverviewResponseDto>
{
  constructor(
    private readonly dashboardReadPort: IDashboardReadPort,
    private readonly dashboardHealthPort: IDashboardHealthPort,
  ) {}

  async execute(
    input: GetDashboardOverviewInput,
  ): Promise<DashboardOverviewResponseDto> {
    const [orders, orderItems, inventoryItems, payments, shipments, notifications, services] =
      await Promise.all([
        this.dashboardReadPort.getOrders(),
        this.dashboardReadPort.getOrderItems(),
        this.dashboardReadPort.getInventoryItems(),
        this.dashboardReadPort.getPayments(),
        this.dashboardReadPort.getShipments(),
        this.dashboardReadPort.getNotifications(),
        this.dashboardHealthPort.checkDependencies(),
      ]);

    const health = toDashboardHealthResponse(services);
    const todayKey = new Date().toISOString().slice(0, 10);
    const activeOrders = orders.filter(
      (order) => ![OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED].includes(order.status as OrderStatusEnum),
    ).length;
    const unhealthyServices = health.services.filter(
      (service) => service.status !== ServiceHealthStatus.HEALTHY,
    ).length;
    const recentOrders = orders
      .slice()
      .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
      .slice(0, input.limit)
      .map((order) => toRecentOrderDto(order, orderItems));

    return {
      summary: {
        totalOrders: orders.length,
        ordersToday: orders.filter((order) =>
          order.created_at.toISOString().startsWith(todayKey),
        ).length,
        activeOrders,
        totalRevenue: payments
          .filter((payment) => payment.status === PaymentStatusEnum.COMPLETED)
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
        totalInventoryUnits: inventoryItems.reduce(
          (sum, item) => sum + Number(item.total_quantity),
          0,
        ),
        lowStockItems: inventoryItems.filter((item) =>
          isLowStock(item.total_quantity, item.reserved_quantity),
        ).length,
        pendingNotifications: notifications.filter(
          (notification) => notification.status === NotificationStatus.PENDING,
        ).length,
        unhealthyServices,
      },
      orderStatusDistribution: countByStatus(orders.map((order) => order.status)),
      paymentStatusDistribution: countByStatus(
        payments.map((payment) => payment.status),
      ),
      shipmentStatusDistribution: countByStatus(
        shipments.map((shipment) => shipment.status),
      ),
      notificationStatusDistribution: countByStatus(
        notifications.map((notification) => notification.status),
      ),
      orderTrend: buildOrderTrend(orders, payments),
      lowStockItems: inventoryItems
        .filter((item) => isLowStock(item.total_quantity, item.reserved_quantity))
        .sort((left, right) => {
          const leftAvailable =
            Number(left.total_quantity) - Number(left.reserved_quantity);
          const rightAvailable =
            Number(right.total_quantity) - Number(right.reserved_quantity);
          return leftAvailable - rightAvailable;
        })
        .slice(0, 5)
        .map((item) => toInventoryAlertDto(item)),
      recentOrders,
      recentActivity: buildActivityFeed({
        orders,
        payments,
        shipments,
        notifications,
        limit: input.limit,
      }),
      health,
      generatedAt: new Date(),
    };
  }
}
