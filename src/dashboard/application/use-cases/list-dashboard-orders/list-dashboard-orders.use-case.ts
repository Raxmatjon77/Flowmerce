import { IUseCase } from '@shared/application';
import {
  DashboardOrderListItemDto,
  DashboardOrderListResponseDto,
} from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { formatAddress } from '../dashboard-view.mapper';

export interface ListDashboardOrdersInput {
  q?: string;
  status?: string;
  limit: number;
}

export class ListDashboardOrdersUseCase
  implements IUseCase<ListDashboardOrdersInput, DashboardOrderListResponseDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardOrdersInput,
  ): Promise<DashboardOrderListResponseDto> {
    const [orders, orderItems] = await Promise.all([
      this.dashboardReadPort.getOrders(),
      this.dashboardReadPort.getOrderItems(),
    ]);
    const normalizedQuery = input.q?.toLowerCase();
    const filtered = orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.id.toLowerCase().includes(normalizedQuery) ||
        order.customer_id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !input.status || order.status === input.status;

      return matchesQuery && matchesStatus;
    });

    const data = filtered
      .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
      .slice(0, input.limit)
      .map(
        (order): DashboardOrderListItemDto => ({
          id: order.id,
          customerId: order.customer_id,
          status: order.status,
          totalAmount: Number(order.total_amount),
          currency: order.currency,
          itemCount: orderItems.filter((item) => item.order_id === order.id).length,
          shippingAddress: formatAddress({
            street: order.shipping_street,
            city: order.shipping_city,
            state: order.shipping_state,
            zipCode: order.shipping_zip_code,
            country: order.shipping_country,
          }),
          createdAt: order.created_at,
        }),
      );

    return {
      data,
      meta: {
        total: filtered.length,
        limit: input.limit,
      },
    };
  }
}
