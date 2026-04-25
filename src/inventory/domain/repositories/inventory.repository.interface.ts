import { InventoryItem } from '../entities/inventory-item.entity';
import { Sku } from '../value-objects/sku.value-object';
import { Quantity } from '../value-objects/quantity.value-object';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface InventoryFindAllParams {
  limit?: number;
  page?: number;
}

export interface IInventoryRepository {
  save(item: InventoryItem): Promise<void>;
  findAll(): Promise<InventoryItem[]>;
  findAllPaginated(params: InventoryFindAllParams): Promise<{ items: InventoryItem[]; total: number }>;
  findById(id: string): Promise<InventoryItem | null>;
  findBySku(sku: Sku): Promise<InventoryItem | null>;
  updateQuantities(
    id: string,
    totalQuantity: Quantity,
    reservedQuantity: Quantity,
  ): Promise<void>;
}
