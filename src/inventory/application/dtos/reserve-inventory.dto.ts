export interface ReserveInventoryItemDto {
  sku: string;
  quantity: number;
}

export interface ReserveInventoryDto {
  orderId: string;
  items: ReserveInventoryItemDto[];
}
