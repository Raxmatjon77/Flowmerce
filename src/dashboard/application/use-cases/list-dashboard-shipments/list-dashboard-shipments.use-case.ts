import { IUseCase } from '@shared/application';
import { DashboardShipmentListResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { toShipmentListItemDto } from '../dashboard-view.mapper';

export interface ListDashboardShipmentsInput {
  q?: string;
  status?: string;
  limit: number;
}

export class ListDashboardShipmentsUseCase
  implements
    IUseCase<ListDashboardShipmentsInput, DashboardShipmentListResponseDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardShipmentsInput,
  ): Promise<DashboardShipmentListResponseDto> {
    const shipments = await this.dashboardReadPort.getShipments();
    const normalizedQuery = input.q?.toLowerCase();
    const filtered = shipments.filter((shipment) => {
      const matchesQuery =
        !normalizedQuery ||
        shipment.id.toLowerCase().includes(normalizedQuery) ||
        shipment.order_id.toLowerCase().includes(normalizedQuery) ||
        (shipment.tracking_number ?? '').toLowerCase().includes(normalizedQuery) ||
        (shipment.carrier_name ?? '').toLowerCase().includes(normalizedQuery);
      const matchesStatus = !input.status || shipment.status === input.status;

      return matchesQuery && matchesStatus;
    });

    return {
      data: filtered
        .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
        .slice(0, input.limit)
        .map((shipment) => toShipmentListItemDto(shipment)),
      meta: {
        total: filtered.length,
        limit: input.limit,
      },
    };
  }
}
