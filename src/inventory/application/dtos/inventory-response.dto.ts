export class InventoryResponseDto {
  id: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}
