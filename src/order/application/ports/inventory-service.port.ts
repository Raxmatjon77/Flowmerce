export const INVENTORY_SERVICE_PORT = Symbol('IInventoryServicePort');

export interface InventoryReservationItem {
  productId: string;
  quantity: number;
}

export interface IInventoryServicePort {
  reserveInventory(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void>;

  releaseInventory(
    orderId: string,
    items: InventoryReservationItem[],
  ): Promise<void>;
}
