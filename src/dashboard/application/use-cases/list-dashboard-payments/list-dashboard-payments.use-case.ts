import { IUseCase } from '@shared/application';
import { DashboardPaymentListResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { toPaymentListItemDto } from '../dashboard-view.mapper';

export interface ListDashboardPaymentsInput {
  q?: string;
  status?: string;
  limit: number;
}

export class ListDashboardPaymentsUseCase
  implements IUseCase<ListDashboardPaymentsInput, DashboardPaymentListResponseDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardPaymentsInput,
  ): Promise<DashboardPaymentListResponseDto> {
    const payments = await this.dashboardReadPort.getPayments();
    const normalizedQuery = input.q?.toLowerCase();
    const filtered = payments.filter((payment) => {
      const methodType = payment.method_type ?? '';
      const matchesQuery =
        !normalizedQuery ||
        payment.id.toLowerCase().includes(normalizedQuery) ||
        payment.order_id.toLowerCase().includes(normalizedQuery) ||
        methodType.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !input.status || payment.status === input.status;

      return matchesQuery && matchesStatus;
    });

    return {
      data: filtered
        .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
        .slice(0, input.limit)
        .map((payment) => toPaymentListItemDto(payment)),
      meta: {
        total: filtered.length,
        limit: input.limit,
      },
    };
  }
}
