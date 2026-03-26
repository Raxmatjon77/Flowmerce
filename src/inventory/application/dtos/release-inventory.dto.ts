export interface ReleaseInventoryItemDto {
  sku: string;
  quantity: number;
}

export interface ReleaseInventoryDto {
  orderId: string;
  items: ReleaseInventoryItemDto[];
}
