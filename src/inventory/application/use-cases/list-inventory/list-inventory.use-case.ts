import { IUseCase } from '@shared/application';
import { IInventoryRepository } from '@inventory/domain';
import { InventoryResponseDto } from '../../dtos/inventory-response.dto';

export interface ListInventoryInput {
  limit?: number;
  page?: number;
}

export interface ListInventoryOutput {
  data: InventoryResponseDto[];
  meta: { total: number; limit: number };
}

export class ListInventoryUseCase
  implements IUseCase<ListInventoryInput, ListInventoryOutput>
{
  constructor(private readonly inventoryRepository: IInventoryRepository) {}

  async execute(input: ListInventoryInput): Promise<ListInventoryOutput> {
    const limit = input.limit ?? 20;
    const page = input.page ?? 1;

    const { items, total } = await this.inventoryRepository.findAllPaginated({
      limit,
      page,
    });

    const data: InventoryResponseDto[] = items.map((item) => ({
      id: item.id,
      sku: item.sku.value,
      productName: item.productName,
      totalQuantity: item.totalQuantity.value,
      reservedQuantity: item.reservedQuantity.value,
      availableQuantity: item.availableQuantity.value,
      unitPrice: item.unitPrice,
    }));

    return { data, meta: { total, limit } };
  }
}
