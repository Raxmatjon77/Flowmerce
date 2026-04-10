import { IUseCase } from '@shared/application';
import { DashboardInventoryListResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import {
  isLowStock,
  toInventoryListItemDto,
} from '../dashboard-view.mapper';

export interface ListDashboardInventoryInput {
  q?: string;
  lowStockOnly?: boolean;
  limit: number;
}

export class ListDashboardInventoryUseCase
  implements
    IUseCase<ListDashboardInventoryInput, DashboardInventoryListResponseDto>
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardInventoryInput,
  ): Promise<DashboardInventoryListResponseDto> {
    const inventoryItems = await this.dashboardReadPort.getInventoryItems();
    const normalizedQuery = input.q?.toLowerCase();
    const filtered = inventoryItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.sku.toLowerCase().includes(normalizedQuery) ||
        item.product_name.toLowerCase().includes(normalizedQuery);
      const matchesLowStock =
        !input.lowStockOnly ||
        isLowStock(item.total_quantity, item.reserved_quantity);

      return matchesQuery && matchesLowStock;
    });

    return {
      data: filtered
        .sort((left, right) => {
          const leftAvailable =
            Number(left.total_quantity) - Number(left.reserved_quantity);
          const rightAvailable =
            Number(right.total_quantity) - Number(right.reserved_quantity);

          return leftAvailable - rightAvailable;
        })
        .slice(0, input.limit)
        .map((item) => toInventoryListItemDto(item)),
      meta: {
        total: filtered.length,
        limit: input.limit,
      },
    };
  }
}
