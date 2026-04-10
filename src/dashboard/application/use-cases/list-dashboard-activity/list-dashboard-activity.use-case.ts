import { IUseCase } from '@shared/application';
import { DashboardActivityResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { buildActivityFeed } from '../dashboard-view.mapper';

export interface ListDashboardActivityInput {
  limit: number;
}

export class ListDashboardActivityUseCase
  implements IUseCase<ListDashboardActivityInput, DashboardActivityResponseDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardActivityInput,
  ): Promise<DashboardActivityResponseDto> {
    const [orders, payments, shipments, notifications] = await Promise.all([
      this.dashboardReadPort.getOrders(),
      this.dashboardReadPort.getPayments(),
      this.dashboardReadPort.getShipments(),
      this.dashboardReadPort.getNotifications(),
    ]);

    return {
      data: buildActivityFeed({
        orders,
        payments,
        shipments,
        notifications,
        limit: input.limit,
      }),
      meta: {
        total:
          orders.length + payments.length + shipments.length + notifications.length,
        limit: input.limit,
      },
    };
  }
}
