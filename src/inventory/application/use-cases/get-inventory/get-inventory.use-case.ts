import { IUseCase } from '@shared/application';
import {
  IInventoryRepository,
  Sku,
  InventoryNotFoundError,
} from '@inventory/domain';
import { InventoryResponseDto } from '../../dtos/inventory-response.dto';

export interface GetInventoryInput {
  sku: string;
}

export class GetInventoryUseCase
  implements IUseCase<GetInventoryInput, InventoryResponseDto>
{
  constructor(
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(input: GetInventoryInput): Promise<InventoryResponseDto> {
    const sku = Sku.create(input.sku);
    const inventoryItem = await this.inventoryRepository.findBySku(sku);

    if (!inventoryItem) {
      throw new InventoryNotFoundError(input.sku);
    }

    return {
      id: inventoryItem.id,
      sku: inventoryItem.sku.value,
      productName: inventoryItem.productName,
      totalQuantity: inventoryItem.totalQuantity.value,
      reservedQuantity: inventoryItem.reservedQuantity.value,
      availableQuantity: inventoryItem.availableQuantity.value,
      unitPrice: inventoryItem.unitPrice,
    };
  }
}
